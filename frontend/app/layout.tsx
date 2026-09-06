import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Weekly Report System",
  description: "Weekly progress reports and team reviews",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
