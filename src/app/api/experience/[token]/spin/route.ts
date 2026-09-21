import { NextResponse } from "next/server";
import { performSpin } from "@/lib/experience-service";
import { spinRequestSchema } from "@/lib/validators";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 2) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = spinRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await performSpin(token, parsed.data.idempotencyKey);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, state: result.state },
      { status: result.status },
    );
  }

  return NextResponse.json({
    gift: result.gift,
    selectedIndex: result.selectedIndex,
    state: result.state,
  });
}
