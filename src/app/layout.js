import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  manifest: "/manifest.json",
  title: "UVibe",
  description:
    "Real-time UV index data for Australian cities, sourced from ARPANSA. Plan your day with confidence and stay sun-safe with UVibe.",
  icons: {
    icon: "/icons/icon-256.png",
    apple: "/icons/icon-256.png",
  },
};
export const viewport = {
  themeColor: "#080a0f",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
