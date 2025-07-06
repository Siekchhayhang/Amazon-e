import VerifyEmailClient from "./verify-email-client";

export default async function Page(props: {
  params: Promise<{
    token: string;
  }>;
}) {
  return <VerifyEmailClient token={(await props.params).token} />;
}
