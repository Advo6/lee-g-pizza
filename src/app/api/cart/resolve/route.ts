import { NextRequest, NextResponse } from "next/server";
import { resolveCartItem } from "@/lib/ai";
import type { CrustType, PizzaSize } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await resolveCartItem({
      productName: body.productName,
      size: body.size as PizzaSize | undefined,
      crust: body.crust as CrustType | undefined,
      toppingNames: body.toppingNames,
      quantity: body.quantity || 1,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cart resolve error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resolve item" },
      { status: 500 }
    );
  }
}
