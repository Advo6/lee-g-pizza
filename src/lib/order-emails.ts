import { sendEmail } from "@/lib/email";
import { formatCurrency, type CartItem } from "@/lib/utils";

interface OrderEmailOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  total: number;
}

interface SendOrderConfirmationEmailParams {
  order: OrderEmailOrder;
  items: CartItem[];
  orderType: "PICKUP" | "DELIVERY";
  address: string | null;
}

export async function sendOrderConfirmationEmail({
  order,
  items,
  orderType,
  address,
}: SendOrderConfirmationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const itemSummary = formatOrderItems(items);
  const trackUrl = `${appUrl}/track?order=${encodeURIComponent(order.orderNumber)}`;
  const receiptUrl = `${appUrl}/receipt?order=${encodeURIComponent(order.orderNumber)}`;
  const recipient = order.customerEmail;
  const safeName = escapeHtml(order.customerName);
  const safeItemSummary = escapeHtml(itemSummary);
  const safeAddress = address ? escapeHtml(address) : "";

  if (!recipient) {
    return [
      {
        sent: false,
        mock: false,
        recipient: "",
        error: "Customer email is missing.",
      },
    ];
  }

  const text =
    `Order confirmed\n\n` +
    `Hi ${order.customerName},\n\n` +
    `Thank you for your purchase! Your Lee-G's Pizza order number is ${order.orderNumber}.\n\n` +
    `${itemSummary}\n\n` +
    `Total: ${formatCurrency(order.total)}\n` +
    `Type: ${orderType === "DELIVERY" ? "Delivery" : "Pickup"}\n` +
    `${address ? `Address: ${address}\n` : ""}` +
    `We'll let you know when your order status changes.\n\n` +
    `Track: ${trackUrl}\n` +
    `Print receipt: ${receiptUrl}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f1f1f; line-height: 1.5;">
      <h2>Order confirmed</h2>
      <p>Hi ${safeName},</p>
      <p>Thank you for your purchase! Your Lee-G's Pizza order number is <strong style="color:#f97316;">${order.orderNumber}</strong>.</p>
      <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${safeItemSummary}</pre>
      <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
      <p><strong>Type:</strong> ${orderType === "DELIVERY" ? "Delivery" : "Pickup"}</p>
      ${safeAddress ? `<p><strong>Address:</strong> ${safeAddress}</p>` : ""}
      <p>We'll let you know when your order status changes.</p>
      <p>
        <a href="${trackUrl}" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;margin-right:8px;">Track order status</a>
        <a href="${receiptUrl}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;">Print receipt</a>
      </p>
    </div>
  `;

  return Promise.all([
    sendEmail({
      to: recipient,
      subject: `Lee-G's Pizza order confirmed: ${order.orderNumber}`,
      text,
      html,
    }),
  ]);
}

export function formatOrderItems(items: CartItem[]) {
  return items
    .map((item) => {
      const toppings = item.toppings?.length
        ? ` + ${item.toppings.map((topping) => topping.name).join(", ")}`
        : "";
      return `${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ""}${toppings}`;
    })
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
