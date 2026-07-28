import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/order-emails";
import { prisma } from "@/lib/prisma";
import type { CartItem } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (!order.customerEmail) {
      return NextResponse.json(
        { success: false, error: "This order has no customer email address." },
        { status: 400 }
      );
    }

    const items = JSON.parse(order.items || "[]") as CartItem[];
    const notifications = await sendOrderConfirmationEmail({
      order,
      items,
      orderType: order.orderType,
      address: order.address,
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Resend order email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend order email." },
      { status: 500 }
    );
  }
}
