import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { serverLang } from "@/i18n/server";
import { LangProvider } from "@/i18n/client";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Meridian AIR — Virtual Airline",
    template: "%s · Meridian AIR",
  },
  description:
    "Meridian AIR — виртуальная авиакомпания на VATSIM и IVAO. Пассажирские, грузовые, военные и советские направления, лётная академия, бронирование рейсов и PIREP.",
  openGraph: {
    title: "Meridian AIR — Virtual Airline",
    description: "Virtual airline on VATSIM / IVAO. Passenger, cargo, military and soviet divisions.",
    images: ["/tailfin-hero.png"],
    locale: "ru_RU",
    alternateLocale: "en_US",
    type: "website",
  },
  icons: { icon: "/tailfin-hero.png" },
};

export const viewport = { themeColor: "#050A14" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ lang, dict }, session] = await Promise.all([serverLang(), getSessionUser()]);
  const sessionDto = session
    ? {
        name: session.name,
        email: session.email,
        pilotId: session.pilotId,
        pilotStatus: session.pilotStatus,
        isAdmin: session.permissions.has("USERS.MANAGE") || session.permissions.has("ROLES.MANAGE"),
      }
    : null;
  return (
    <html lang={lang}>
      <body className={`${inter.variable} ${mono.variable} font-sans`}>
        <LangProvider lang={lang} dict={dict}>
          <Navbar session={sessionDto} />
          <main className="min-h-screen pt-16">{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
