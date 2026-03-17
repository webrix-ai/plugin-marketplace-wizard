import { NextResponse } from "next/server";
import { scanSystem } from "@/lib/scanner";

export async function GET() {
  try {
    const result = await scanSystem();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    );
  }
}
