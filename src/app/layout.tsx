import type { Metadata } from "next";
import "./globals.css";
import UpdateNotice from "@/components/update-notice";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
const siteName = "Learn Japanese Free - Ivo Sensei";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: "%s | Learn Japanese Free - Ivo Sensei",
  },
  description:
    "Learn Japanese with free daily practice: SRS flashcards, listening drills, grammar puzzles, and JLPT-ready study modes.",
  applicationName: siteName,
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "learn japanese",
    "learn japanese free",
    "jlpt n5",
    "japanese listening practice",
    "japanese grammar quiz",
    "japanese flashcards",
    "ivo sensei",
  ],
  category: "education",
  creator: "Ivo Sensei",
  publisher: "Ivo Sensei",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: siteName,
    description:
      "Practice Japanese daily with review cards, listening drills, grammar puzzles, and kana training.",
    url: siteUrl,
    siteName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Learn Japanese Free - Ivo Sensei",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description:
      "Learn Japanese free with SRS cards, listening drills, and grammar puzzle practice.",
    images: ["/icon.svg"],
  },
  verification: {
    google: "5wyHjsfwHWuTcB1R3IHwX5xNmtKHeuoFE-f75ZIdFBM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    inLanguage: ["en", "id"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: siteUrl,
    description:
      "Mobile-first Japanese learning web app with free JLPT vocabulary practice, listening quizzes, and grammar puzzles.",
  };

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        />
        {children}
        <UpdateNotice />
      </body>
    </html>
  );
}
