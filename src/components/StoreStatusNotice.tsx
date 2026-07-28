"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getWhatsAppUrl, STORE_INFO } from "@/lib/utils";

interface StoreStatus {
  isOpen: boolean;
  updatedAt: string;
}

export default function StoreStatusNotice() {
  const [status, setStatus] = useState<StoreStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/store-status", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setStatus({
          isOpen: data.isOpen,
          updatedAt: data.updatedAt,
        });
      }
    } catch {
      /* keep quiet if the notice cannot load */
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = window.setInterval(fetchStatus, 30000);
    return () => window.clearInterval(interval);
  }, [fetchStatus]);

  if (!status || status.isOpen) return null;

  return (
    <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-yellow-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
          <p>
            Lee-G&apos;s Pizza is currently closed for a moment. Please keep monitoring this
            website, or contact Lee-G&apos;s Pizza on the number below.
          </p>
        </div>
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-semibold text-yellow-200 transition-colors hover:text-[#25D366]"
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
          {STORE_INFO.phone}
        </a>
      </div>
    </div>
  );
}
