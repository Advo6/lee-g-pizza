import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { sendEmail } from "@/lib/email";

import { STATUS_LABELS } from "@/lib/utils";

import { isAdminRequest } from "@/lib/auth";



export async function PATCH(

  req: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  if (!isAdminRequest(req)) {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  }



  try {

    const { id } = await params;

    const { status } = await req.json();



    if (!status) {

      return NextResponse.json({ success: false, error: "Status required" }, { status: 400 });

    }



    const updateData: Record<string, unknown> = { status };

    if (status === "COMPLETED") {

      updateData.completedAt = new Date();

    }



    const order = await prisma.order.update({

      where: { id },

      data: updateData,

    });



    const statusLabel = STATUS_LABELS[status] || status;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const encodedOrderNumber = encodeURIComponent(order.orderNumber);
    const trackUrl = `${appUrl}/track?order=${encodedOrderNumber}`;
    const receiptUrl = `${appUrl}/receipt?order=${encodedOrderNumber}`;
    const receiptText =
      status === "COMPLETED" ? ` Print your receipt here: ${receiptUrl}` : "";
    const receiptButton =
      status === "COMPLETED"
        ? `<a href="${receiptUrl}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;margin-left:8px;">Print receipt</a>`
        : "";
    const safeName = escapeHtml(order.customerName);
    const safeStatusLabel = escapeHtml(statusLabel);
    const message =
      `Hi ${order.customerName}, your Lee-G's Pizza order ${order.orderNumber} ` +
      `is now: ${statusLabel}. Track it here: ${trackUrl}.${receiptText}`;

    const notification = order.customerEmail
      ? await sendEmail({
          to: order.customerEmail,
          subject: `Lee-G's Pizza order ${order.orderNumber}: ${statusLabel}`,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1f1f1f; line-height: 1.5;">
              <h2>Order status updated</h2>
              <p>Hi ${safeName},</p>
              <p>Your Lee-G's Pizza order <strong style="color:#f97316;">${order.orderNumber}</strong> is now:</p>
              <p style="font-size:20px;font-weight:bold;">${safeStatusLabel}</p>
              <p>
                <a href="${trackUrl}" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;">Track order status</a>
                ${receiptButton}
              </p>
            </div>
          `,
        })
      : {
          sent: false,
          recipient: "",
          error: "Customer email is missing.",
        };



    return NextResponse.json({ success: true, order, notification });

  } catch (error) {

    console.error("Update order error:", error);

    return NextResponse.json(

      { success: false, error: "Failed to update order" },

      { status: 500 }

    );

  }

}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


