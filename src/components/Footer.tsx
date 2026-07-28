import { MapPin, Clock } from "lucide-react";
import ContactPhoneButton from "@/components/ContactPhoneButton";
import { STORE_HOURS, STORE_INFO } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-charcoal-800 bg-charcoal-900/50 print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-2xl tracking-wide text-white">
              {STORE_INFO.name}
            </h3>
            <p className="mt-2 text-sm text-stone-400">{STORE_INFO.tagline}</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
              Contact
            </h4>
            <div className="space-y-2 text-sm text-stone-400">
              <ContactPhoneButton className="gap-2" iconClassName="h-4 w-4" />
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {STORE_INFO.location}
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
              Hours
            </h4>
            <div className="flex items-start gap-2 text-sm text-stone-400">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <ul className="w-full space-y-1">
                {STORE_HOURS.map(({ day, hours }) => (
                  <li key={day} className="flex justify-between gap-4">
                    <span>{day}</span>
                    <span className={hours === "Closed" ? "text-stone-500" : "text-stone-300"}>
                      {hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-xs text-stone-500">
              Delivery & pickup available. Order and pay online; email confirmations and status updates included.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-charcoal-800 pt-6 text-center text-xs text-stone-600">
          © {new Date().getFullYear()} {STORE_INFO.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
