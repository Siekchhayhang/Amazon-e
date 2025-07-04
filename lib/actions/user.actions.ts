'use server'

import { auth, signIn, signOut } from '@/auth'
import { IUserName, IUserSignIn, IUserSignUp, ShippingAddress } from '@/types'
import { sendResetPasswordEmail, sendVerificationEmail } from '@/emails'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { connectToDatabase } from '../db'
import User, { IUser } from '../db/models/user.model'
import { formatError } from '../utils'
import { UserPasswordUpdateSchema, UserSignUpSchema, UserUpdateSchema } from '../validator'
import { getSetting } from './setting.actions'
import { addHours } from 'date-fns'



// CREATE
export async function registerUser(userSignUp: IUserSignUp) {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email,
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,

    })

    await connectToDatabase()
    await User.create({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    })
    return { success: true, message: 'User created successfully' }
  } catch (error) {
    return { success: false, error: formatError(error) }
  }
}

// DELETE

export async function deleteUser(id: string) {
  try {
    await connectToDatabase()
    const res = await User.findByIdAndDelete(id)
    if (!res) throw new Error('Use not found')
    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
// UPDATE

export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
  try {
    await connectToDatabase()
    const dbUser = await User.findById(user._id)
    if (!dbUser) throw new Error('User not found')

    const previousRole = dbUser.role; // Store previous role for revalidation
    dbUser.name = user.name
    dbUser.email = user.email
    dbUser.role = user.role
    const updatedUser = await dbUser.save()
    revalidatePath('/admin/users')

    // If user downgraded themselves, force sign out
    const session = await auth()
    if (session?.user?.id === user._id && previousRole !== user.role) {
      await signOut({ redirect: true })
    }
    return {
      success: true,
      message: 'User updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
export async function updateUserName(user: IUserName) {
  try {
    await connectToDatabase()
    const session = await auth()
    const currentUser = await User.findById(session?.user?.id)
    if (!currentUser) throw new Error('User not found')
    currentUser.name = user.name
    const updatedUser = await currentUser.save()
    return {
      success: true,
      message: 'User updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE PASSWORD
export async function updateUserPassword(values: z.infer<typeof UserPasswordUpdateSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated.' };
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id).select('+password'); // Select the password field

    if (!user?.password) {
      return { success: false, message: 'User password not found in database.' };
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(values.oldPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      return { success: false, message: 'Incorrect current password.' };
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    revalidatePath('/account/manage');
    return { success: true, message: 'Password updated successfully.' };

  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// export async function signInWithCredentials(user: IUserSignIn) {
//   return await signIn('credentials', { ...user, redirect: false })
export async function signInWithCredentials(user: IUserSignIn) {
  await connectToDatabase();

  const existingUser = await User.findOne({ email: user.email }).select('+password');

  if (!existingUser) {
    throw new Error('Invalid email or password');
  }

  const isPasswordCorrect = await bcrypt.compare(user.password, existingUser.password);
  if (!isPasswordCorrect) {
    throw new Error('Invalid email or password');
  }

  // 🔒 Check if email is verified
  if (!existingUser.emailVerified) {
    throw new Error('Please verify your email before signing in');
  }

  // Proceed to sign in
  return await signIn('credentials', {
    ...user,
    redirect: false,
  });
}

export const SignInWithGoogle = async () => {
  await signIn('google')
}
export const SignOut = async () => {
  const redirectTo = await signOut({ redirect: false })
  redirect(redirectTo.redirect)
}

// GET
export async function getAllUsers({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  const skipAmount = (Number(page) - 1) * limit
  const users = await User.find()
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const usersCount = await User.countDocuments()
  return {
    data: JSON.parse(JSON.stringify(users)) as IUser[],
    totalPages: Math.ceil(usersCount / limit),
  }
}

export async function getUserById(userId: string) {
  await connectToDatabase()
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')
  return JSON.parse(JSON.stringify(user)) as IUser
}

export async function saveEditShippingAddressToDatabase(
  shippingAddress: ShippingAddress
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id);

    if (!user) {
      throw new Error('User not found');
    }

    // Update the user's shipping address
    user.shippingAddress = shippingAddress;
    await user.save();
    return { success: true, message: 'Shipping address saved successfully' };
  } catch (error) {
    console.error('Error saving shipping address:', error);
    return { success: false, message: formatError(error) };
  }
}

export async function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function registerUserWithEmailVerification(userSignUp: IUserSignUp) {
  try {
    await connectToDatabase();
    const existingUser = await User.findOne({ email: userSignUp.email }).select('_id');
    if (existingUser) throw new Error('Email already in use');

    const verificationToken = await generateToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expiry set to 24 hours

    const newUser = await User.create({
      ...userSignUp,
      password: await bcrypt.hash(userSignUp.password, 10),
      emailVerified: false,
      verificationToken,
      verificationTokenExpires: tokenExpires,
    });

    try {
      await sendVerificationEmail({ email: userSignUp.email, token: verificationToken });
    } catch {
      // 🧹 Cleanup: Delete user if email fails to send
      await User.findByIdAndDelete(newUser._id);
      return { success: false, message: "Error sending verification email. Please try again later." };
    }
    return { success: true, message: 'User registered. Please verify your email.' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' }; // Providing specific error messages
  }
}

export async function verifyEmail(token: string) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ verificationToken: token });

    if (!user || !user.verificationTokenExpires || new Date() > user.verificationTokenExpires) {
      throw new Error('Invalid or expired token');
    }

    if (user.emailVerified) {
      return { success: false, error: 'Email is already verified' };
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}


export async function resendVerificationEmail(email: string) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
    if (user.emailVerified) throw new Error('User already verified');

    // If token still valid, reuse it
    let token = user.verificationToken;
    let expiry = user.verificationTokenExpires;

    const isTokenExpired = !expiry || new Date() > expiry;
    if (isTokenExpired) {
      token = await generateToken();
      expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      user.verificationToken = token;
      user.verificationTokenExpires = expiry;
      await user.save();
    }

    await sendVerificationEmail({ email, token: token! });

    return { success: true, message: 'Verification email resent successfully' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}


export async function requestPasswordReset(email: string) {
  try {
    await connectToDatabase();
    const user = await User.findOne({ email: email });
    if (!user) throw new Error('User not found');

    // Check if user already requested reset in last 24 hours
    const now = new Date();
    const lastRequest = user.lastPasswordResetRequest;

    if (lastRequest && now.getTime() - lastRequest.getTime() < 24 * 60 * 60 * 1000) {
      const nextAvailable = new Date(lastRequest.getTime() + 24 * 60 * 60 * 1000);
      return {
        success: false,
        error: `Reset password link already sent. You can request again after ${nextAvailable.toLocaleString()}`,
        status: 429,
      };
    }

    const resetToken = await generateToken();
    const tokenExpires = addHours(new Date(), 24);

    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpires = tokenExpires;
    user.lastPasswordResetRequest = now; // ✅ set request time

    await user.save();

    await sendResetPasswordEmail({ email, token: resetToken });
    return { success: true, message: 'Password reset email sent' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}


interface ResetPasswordParams {
  token: string;
  newPassword: string;
}

export async function resetPassword({ token, newPassword }: ResetPasswordParams) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ resetPasswordToken: token });
    if (!user || !user.resetPasswordTokenExpires || new Date() > user.resetPasswordTokenExpires) {
      throw new Error('Invalid or expired token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
    await user.save();

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

export async function getUserByEmail(
  email: string
): Promise<Omit<IUser, 'password' | 'verificationToken' | 'verificationTokenExpires' | 'resetPasswordToken' | 'resetPasswordTokenExpires'>> {
  try {
    await connectToDatabase();

    const user = await User.findOne({ email }).select(
      '-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordTokenExpires'
    );

    if (!user) {
      throw new Error(`No user found with email: ${email}`);
    }

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    throw new Error(error instanceof Error ? error.message : 'Something went wrong while fetching user');
  }
}