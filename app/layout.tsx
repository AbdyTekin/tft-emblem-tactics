import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from '@/context/language-context';
import DynamicMetadata from '@/components/DynamicMetadata';

const description =
  "Build Teamfight Tactics Set 18 boards around your emblems: vertical and Bronze For Life teams that follow the real game rules.";

export const metadata: Metadata = {
  metadataBase: new URL("https://tft-emblem-tactics.vercel.app"),
  title: "TFT Emblem Tactics",
  description,
  openGraph: { title: "TFT Emblem Tactics", description, url: "/", siteName: "TFT Emblem Tactics", type: "website" },
  twitter: { card: "summary", title: "TFT Emblem Tactics", description },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased font-sans">
        <LanguageProvider>
          <DynamicMetadata />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
