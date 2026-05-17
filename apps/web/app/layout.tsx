import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Vibebox",
  description: "Real-time collaborative music queue.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="relative min-h-screen bg-background font-sans text-white overflow-hidden">
        {/* Atmospheric Underglow */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-start/20 via-background to-background blur-[140px]" />
        
        <main className="relative z-10 h-full w-full max-w-md mx-auto sm:max-w-xl md:max-w-4xl flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
