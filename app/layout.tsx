import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// DESIGN.md: Copernicus/StyreneB are licensed, so use its documented open
// substitutes: Cormorant Garamond (display) and Inter (body).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500"],
});

const mono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ExLENT Program", template: "%s | ExLENT Program" },
  description: "Manage students and track class attendance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors />
        {/* Minimal consent notice for IP/session storage */}
        <div className="fixed bottom-0 inset-x-0 bg-background/95 border-t text-xs text-center py-2 text-muted-foreground">
          We store essential session data (IP, user agent) for security. See <a href="/legal/privacy" className="underline">Privacy Policy</a>.
        </div>      </body>
    </html>
  );
}
