import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get("orderNumber")?.trim();

  if (!orderNumber) {
    return NextResponse.json(
      { success: false, error: "Order number required" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      customerName: true,
      orderType: true,
      status: true,
      channel: true,
      paymentStatus: true,
      paymentMethod: true,
      items: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      address: true,
      createdAt: true,
      completedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, order });
}
