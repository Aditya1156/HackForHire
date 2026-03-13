import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Versatile Evaluator — AI-Powered Assessment & Interview Platform",
  description:
    "Universal AI testing and interview simulation platform. Evaluate open-ended answers, simulate real interviews with resume-parsed questions, and get instant diagnostic feedback.",
  keywords: ["AI assessment", "interview simulation", "rubric grading", "coding test", "HR interview"],
  authors: [{ name: "Versatile Evaluator" }],
  openGraph: {
    title: "Versatile Evaluator",
    description: "AI-Powered Universal Assessment & Interview Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
