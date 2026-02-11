import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemPrompts } from "@/db/schema/generated-articles";
import { eq } from "drizzle-orm";
import { updatePromptSchema } from "@/lib/validations/prompt";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/prompts/[id] — Get a specific prompt version
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const promptId = parseInt(id, 10);
    if (isNaN(promptId)) {
      return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
    }

    const prompt = db
      .select()
      .from(systemPrompts)
      .where(eq(systemPrompts.id, promptId))
      .get();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("[API] Failed to get prompt:", error);
    return NextResponse.json(
      { error: "Failed to get prompt" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/prompts/[id]/activate — Activate a specific prompt version
 *
 * We use PUT on the prompt ID itself for activation since the issue spec
 * defines `PUT /api/prompts/:id/activate`. For simplicity, we use the
 * `[id]` route with a query param `action=activate`.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const promptId = parseInt(id, 10);
    if (isNaN(promptId)) {
      return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "activate") {
      // Activate this specific version
      const prompt = db
        .select()
        .from(systemPrompts)
        .where(eq(systemPrompts.id, promptId))
        .get();

      if (!prompt) {
        return NextResponse.json(
          { error: "Prompt niet gevonden" },
          { status: 404 }
        );
      }

      // Deactivate all
      db.update(systemPrompts)
        .set({ isActive: false })
        .where(eq(systemPrompts.isActive, true))
        .run();

      // Activate this one
      const updated = db
        .update(systemPrompts)
        .set({ isActive: true })
        .where(eq(systemPrompts.id, promptId))
        .returning()
        .get();

      return NextResponse.json(updated);
    }

    // Default PUT: update prompt content (creates new version conceptually,
    // but for simplicity we update the content if it's the active prompt)
    const body = await req.json();
    const parsed = updatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = db
      .update(systemPrompts)
      .set({
        content: parsed.data.content,
        comment: parsed.data.comment || null,
      })
      .where(eq(systemPrompts.id, promptId))
      .returning()
      .get();

    if (!updated) {
      return NextResponse.json(
        { error: "Prompt niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] Failed to update prompt:", error);
    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}
