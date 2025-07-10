import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import ClientProviders from "@/components/shared/client-providers";
import { getDirection } from "@/i18n-config";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getSetting } from "@/lib/actions/setting.actions";
import { cookies } from "next/headers";
import { NEXT_PUBLIC_SERVER_URL } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export async function generateMetadata() {
//   const {
//     site: { slogan, name, description, url },
//   } = await getSetting();
//   return {
//     title: {
//       template: `%s | ${name}`,
//       default: `${name}. ${slogan}`,
//     },
//     description: description,
//     metadataBase: new URL(url),
//   };
// }

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const {
    site: { slogan, name, description, url },
  } = await getSetting();

  const baseUrl = url ?? NEXT_PUBLIC_SERVER_URL;
  const locale = params.locale;

  const alternates: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    alternates[loc] = `${baseUrl}/${loc}`;
  });

  return {
    title: {
      template: `%s | ${name}`,
      default: `${name}. ${slogan}`,
    },
    description: description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: alternates,
    },
  };
}

export default async function AppLayout({
  params,
  children,
}: {
  params: { locale: string };
  children: React.ReactNode;
}) {
  const setting = await getSetting();
  const currencyCookie = (await cookies()).get("currency");
  const currency = currencyCookie ? currencyCookie.value : "USD";

  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={getDirection(locale) === "rtl" ? "ltr" : "ltr"}
      suppressHydrationWarning
    >
      <body
        className={`min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders setting={{ ...setting, currency }}>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
