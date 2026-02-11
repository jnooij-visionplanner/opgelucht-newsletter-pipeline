import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemPrompts } from "@/db/schema/generated-articles";
import { desc, eq, ne } from "drizzle-orm";
import { createPromptSchema, updatePromptSchema } from "@/lib/validations/prompt";

/**
 * GET /api/prompts — List all prompt versions (newest first)
 */
export async function GET() {
  try {
    const all = db
      .select()
      .from(systemPrompts)
      .orderBy(desc(systemPrompts.version))
      .all();

    return NextResponse.json(all);
  } catch (error) {
    console.error("[API] Failed to list prompts:", error);
    return NextResponse.json(
      { error: "Failed to list prompts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts — Create a new prompt version
 *
 * Automatically increments version number and deactivates previous prompts.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Get current max version
    const latest = db
      .select({ version: systemPrompts.version })
      .from(systemPrompts)
      .orderBy(desc(systemPrompts.version))
      .limit(1)
      .get();

    const nextVersion = (latest?.version ?? 0) + 1;

    // Deactivate all existing prompts
    db.update(systemPrompts)
      .set({ isActive: false })
      .where(eq(systemPrompts.isActive, true))
      .run();

    // Create new active version
    const created = db
      .insert(systemPrompts)
      .values({
        name: parsed.data.name,
        content: parsed.data.content,
        version: nextVersion,
        isActive: true,
        comment: parsed.data.comment || null,
      })
      .returning()
      .get();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[API] Failed to create prompt:", error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}
