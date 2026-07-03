import type { Metadata } from "next";
import "../styles/Colors.css";
import "../styles/Typography.css";
import "../styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "راشد",
  description: "منصة برامج تربوية تفاعلية للأطفال",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}