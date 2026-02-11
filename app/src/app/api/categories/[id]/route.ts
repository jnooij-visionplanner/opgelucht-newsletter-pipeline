import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema/categories";
import { eq } from "drizzle-orm";
import { updateCategorySchema } from "@/lib/validations/category";

/**
 * GET /api/categories/:id — Get single category
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const category = db
    .select()
    .from(categories)
    .where(eq(categories.id, numId))
    .get();

  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(category);
}

/**
 * PUT /api/categories/:id — Update a category
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(categories)
      .where(eq(categories.id, numId))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const updated = db
      .update(categories)
      .set({
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, numId))
      .returning()
      .get();

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return NextResponse.json(
        { error: "Categorie met deze naam bestaat al" },
        { status: 409 }
      );
    }
    console.error("[API] Failed to update category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/:id — Soft-delete (set isActive=false)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const existing = db
    .select()
    .from(categories)
    .where(eq(categories.id, numId))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  db.update(categories)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(categories.id, numId))
    .run();

  return NextResponse.json({ message: "Category deactivated" });
}
