import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KaarigarOS — My Work",
};

export default function KarigarPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} min-h-screen antialiased`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground">
        <div className="flex min-h-screen flex-col items-center bg-background px-4 py-6">
          {/* Logo */}
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold text-primary">
              KaarigarOS
            </h1>
          </div>
          {/* Content */}
          <div className="w-full max-w-md">{children}</div>
        </div>
      </body>
    </html>
  );
}
