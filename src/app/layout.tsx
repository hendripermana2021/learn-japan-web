import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learn Japanese Free - Ivo Sensei",
  description: "Mobile-first Japanese learning web app with SRS and quiz mode",
  applicationName: "Learn Japanese Free - Ivo Sensei",
  metadataBase: new URL("https://example.com"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Learn Japanese Free - Ivo Sensei",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Learn Japanese Free - Ivo Sensei",
    description: "Practice Japanese daily with review cards, quiz mode, and kana drills.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
