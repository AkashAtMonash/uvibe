import "./globals.css";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#080a0f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
