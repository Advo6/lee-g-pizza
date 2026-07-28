"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Pizza } from "lucide-react";
import ContactPhoneButton from "@/components/ContactPhoneButton";
import { cn } from "@/lib/utils";
import { STORE_INFO } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Menu" },
  { href: "/checkout", label: "Checkout" },
  { href: "/track", label: "Track Order" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-700/60 bg-charcoal-950/90 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-red shadow-glow transition-transform group-hover:scale-105">
            <Pizza className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl leading-none tracking-wider text-white">
              {STORE_INFO.name}
            </h1>
            <p className="text-xs text-stone-500">{STORE_INFO.tagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-brand-orange/15 text-brand-orange"
                  : "text-stone-400 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <ContactPhoneButton />
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[180px] truncate">{STORE_INFO.location}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
