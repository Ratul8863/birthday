import { NextResponse } from "next/server";
import { saveDinnerPlan } from "@/lib/experience-service";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 2) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    restaurant?: string;
    time?: string;
  } | null;

  const result = saveDinnerPlan(token, body?.restaurant ?? "", body?.time ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ state: result.state });
}
