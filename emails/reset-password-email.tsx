import { getSetting } from '@/lib/actions/setting.actions';
import { getUserByEmail } from '@/lib/actions/user.actions';
import { addHours } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { Timezone } from 'next-intl';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default async function ResetPasswordEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const user = await getUserByEmail(email);
  const { site } = await getSetting();
  const resetLink = `${site.url}/reset-password?t=${token}`;
  const tokenExpiryUtc = addHours(new Date(), 24);
  const timeZone = (user as { timeZone?: string }).timeZone || "Asia/Phnom_Penh";
  const zonedDate = toZonedTime(tokenExpiryUtc, timeZone);
  const formattedExpiry = format(zonedDate, "PPP p zzz", {
    timeZone: timeZone as Timezone,
  });

  return (
    <Html>
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Reset Your Password</Heading>
            <Section>
              <Text>Hello {user.name || user.email},</Text>
              <Text>
                You recently requested to reset the password for your {site.name}
                account. Click the button below to reset it.
              </Text>
              <Button href={resetLink}>Reset My Password</Button>
              <Text>
                Alternatively, you can copy and paste the following link into your
                web browser:
              </Text>
              <Text>{resetLink}</Text>
              <Text className="text-sm text-gray-500">
                This password reset link is valid for 24 hours and will expire at{" "}
                {formattedExpiry} ({timeZone} time).
              </Text>
              <Text>
                If you did not request a password reset, please ignore this email
                and your password will remain unchanged.
              </Text>
              <Text>Thanks,</Text>
              <Text>The {site.name} Team</Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
