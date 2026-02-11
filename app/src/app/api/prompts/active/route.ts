import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemPrompts } from "@/db/schema/generated-articles";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/prompts/active — Get the currently active system prompt
 */
export async function GET() {
  try {
    const active = db
      .select()
      .from(systemPrompts)
      .where(eq(systemPrompts.isActive, true))
      .orderBy(desc(systemPrompts.version))
      .limit(1)
      .get();

    if (!active) {
      return NextResponse.json(
        { error: "Geen actieve prompt gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json(active);
  } catch (error) {
    console.error("[API] Failed to get active prompt:", error);
    return NextResponse.json(
      { error: "Failed to get active prompt" },
      { status: 500 }
    );
  }
}
