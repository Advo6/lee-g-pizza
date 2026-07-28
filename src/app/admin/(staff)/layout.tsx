import { Pizza } from "lucide-react";
import Link from "next/link";
import { STORE_INFO } from "@/lib/utils";
import AdminLogoutButton from "../AdminLogoutButton";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-charcoal-950">
      <header className="border-b border-charcoal-700/60 bg-charcoal-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-orange to-brand-red">
              <Pizza className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-display text-xl leading-none tracking-wider text-white">
                {STORE_INFO.name}
              </p>
              <p className="text-xs text-stone-500">Staff Dashboard</p>
            </div>
          </Link>
          <AdminLogoutButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
