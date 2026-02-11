import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema/categories";
import { asc } from "drizzle-orm";
import { createCategorySchema } from "@/lib/validations/category";

/**
 * GET /api/categories — List all categories (ordered by displayOrder)
 */
export async function GET() {
  try {
    const all = db
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder), asc(categories.name))
      .all();

    return NextResponse.json(all);
  } catch (error) {
    console.error("[API] Failed to list categories:", error);
    return NextResponse.json(
      { error: "Failed to list categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories — Create a new category
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const created = db
      .insert(categories)
      .values(parsed.data)
      .returning()
      .get();

    return NextResponse.json(created, { status: 201 });
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
    console.error("[API] Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
