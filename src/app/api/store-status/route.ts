import { NextRequest, NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/auth";
import { getStoreStatus, setStoreStatus } from "@/lib/store-status";

export async function GET() {
  const status = await getStoreStatus();
  return NextResponse.json({ success: true, ...status, status });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { isOpen } = await req.json();

    if (typeof isOpen !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Store status must be open or closed." },
        { status: 400 }
      );
    }

    const status = await setStoreStatus(isOpen);
    return NextResponse.json({ success: true, ...status, status });
  } catch (error) {
    console.error("Update store status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update store status." },
      { status: 500 }
    );
  }
}
