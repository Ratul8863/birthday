import { NextResponse } from "next/server";
import { getOrCreateExperience, getPublicConfig } from "@/lib/experience-service";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 2) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const state = await getOrCreateExperience(token);
  const config = getPublicConfig();

  return NextResponse.json({
    config,
    state,
  });
}
