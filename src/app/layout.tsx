import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const cabinetGrotesk = localFont({
  src: [
    {
      path: "../fonts/CabinetGrotesk-Medium.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/CabinetGrotesk-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/CabinetGrotesk-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/CabinetGrotesk-Extrabold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-cabinet",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zed – Navigate Nigerian Civil Processes",
    template: "%s | Zed",
  },
  description:
    "The civil guide for Nigerian youth – navigate passport renewals, NYSC call-up, NIN & BVN, and CAC registration with clarity.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zed",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`dark ${cabinetGrotesk.variable} ${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased font-sans selection:bg-primary/20 selection:text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="zed-theme-v2"
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={150}>
            {children}
            <Toaster
              theme="system"
              closeButton
              richColors
              position="top-right"
              toastOptions={{
                className: "border-hairline font-sans text-sm",
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
