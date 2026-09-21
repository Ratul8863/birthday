import { NextResponse } from "next/server";
import { wordMatches } from "@/lib/vault-word";
import { getStoredExperience } from "@/lib/experience-store";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 2) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const attempt = body?.password ?? "";

  if (!wordMatches(attempt)) {
    return NextResponse.json({ error: "That's not the one." }, { status: 403 });
  }

  const record = getStoredExperience(token);
  if (!record?.note?.trim()) {
    return NextResponse.json({ error: "Nothing here yet." }, { status: 404 });
  }

  return NextResponse.json({ note: record.note });
}
