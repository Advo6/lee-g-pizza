"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-lg border border-charcoal-600 px-3 py-2 text-sm text-stone-400 transition-colors hover:border-charcoal-500 hover:text-white"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
