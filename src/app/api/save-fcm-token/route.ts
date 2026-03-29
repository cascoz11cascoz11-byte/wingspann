import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const supabase = createClient(url, key);
  const { user_id, fcm_token } = await req.json();
  if (!user_id || !fcm_token) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await supabase.from("push_tokens").upsert(
    { user_id, token: fcm_token, platform: "ios", updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ success: true });
}