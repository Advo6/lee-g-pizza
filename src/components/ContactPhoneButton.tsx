import WhatsAppIcon from "@/components/WhatsAppIcon";
import { cn, getWhatsAppUrl, STORE_INFO } from "@/lib/utils";

interface ContactPhoneButtonProps {
  className?: string;
  iconClassName?: string;
}

export default function ContactPhoneButton({
  className,
  iconClassName,
}: ContactPhoneButtonProps) {
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-[#25D366]",
        className
      )}
      aria-label={`Chat with Lee-G's Pizza on WhatsApp at ${STORE_INFO.phone}`}
    >
      <WhatsAppIcon className={cn("h-3.5 w-3.5 shrink-0 text-[#25D366]", iconClassName)} />
      {STORE_INFO.phone}
    </a>
  );
}
