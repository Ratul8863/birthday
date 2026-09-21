import type { Metadata } from "next";
import { ADLaM_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const adlam = ADLaM_Display({
  variable: "--font-adlam",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Birthday Surprise",
  description: "An interactive birthday journey made just for you.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${adlam.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
