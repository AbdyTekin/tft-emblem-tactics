import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from '@/context/language-context';
import DynamicMetadata from '@/components/DynamicMetadata';

export const metadata: Metadata = {
  title: "TFT Emblem Tactics",
  description: "TFT Emblem Tactics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <LanguageProvider>
          <DynamicMetadata />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
