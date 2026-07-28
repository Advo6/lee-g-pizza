import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import AppChrome from "@/components/AppChrome";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "Lee-G's Pizza | Phalaborwa's Finest",
  description:
    "Order hot, fresh pizza from Lee-G's Pizza in Phalaborwa. Standard, Double & Triple Decker pizzas, sides, and more. Delivery & pickup available.",
  keywords: ["pizza", "Phalaborwa", "Lee-G's Pizza", "delivery", "takeaway"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body className="min-h-screen font-sans">
        <CartProvider>
          <AppChrome>{children}</AppChrome>
        </CartProvider>
      </body>
    </html>
  );
}
