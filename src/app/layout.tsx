import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pop - Amplify Your Content",
  description: "Create stunning, high-fidelity landing and social links pages that make your content pop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-primary text-slate-100">
        {children}
      </body>
    </html>
  );
}
