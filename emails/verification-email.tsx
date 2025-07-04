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

export default async function VerificationEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const user = await getUserByEmail(email);
  const { site } = await getSetting();
  const verificationLink = `${site.url}/verify-email?t=${token}`;
  const tokenExpiryUtc = addHours(new Date(), 24);
  const timeZone = (user as { timeZone?: string }).timeZone || "Asia/Phnom_Penh";
  const zonedDate = toZonedTime(tokenExpiryUtc, timeZone);
  const formattedExpiry = format(zonedDate, "PPP p zzz", {
    timeZone: timeZone as Timezone,
  });

  return (
    <Html>
      <Preview>Verify your email address</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Welcome to {site.name}!</Heading>
            <Section>
              <Text>Hello {user.name || user.email},</Text>
              <Text>
                Thank you for registering with {site.name}. To activate your
                account and get started, please confirm your email address by
                clicking the link below:
              </Text>
              <Button href={verificationLink}>Verify My Email</Button>
              <Text>
                Alternatively, you can copy and paste the following link into your
                web browser:
              </Text>
              <Text>{verificationLink}</Text>
              <Text className="text-sm text-gray-500">
                This verification link is valid for 24 hours and will expire at{" "}
                {formattedExpiry} ({timeZone} time).
              </Text>
              <Text>
                If you did not create an account with {site.name}, please ignore
                this email.
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
