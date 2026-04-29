import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { mergeWatched } from "@/shared/lib/auth-db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const { ids } = (await req.json()) as { ids: string[] };
  if (Array.isArray(ids) && ids.length > 0) {
    await mergeWatched(userId, ids);
  }
  return NextResponse.json({ merged: ids?.length ?? 0 });
}
