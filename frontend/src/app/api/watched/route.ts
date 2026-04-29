import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getWatchedIds, addWatched, removeWatched } from "@/shared/lib/auth-db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ids: [] });
  const userId = parseInt(session.user.id, 10);
  return NextResponse.json({ ids: getWatchedIds(userId) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt(session.user.id, 10);
  const { videoId, action } = (await req.json()) as {
    videoId: string;
    action: "add" | "remove";
  };
  if (!videoId) return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  if (action === "add") addWatched(userId, videoId);
  else if (action === "remove") removeWatched(userId, videoId);
  return NextResponse.json({ ok: true });
}
