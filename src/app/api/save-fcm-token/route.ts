import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { user_id, fcm_token } = await req.json();
    if (!user_id || !fcm_token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id,
      fcm_token,
    }, { onConflict: "user_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Token saved" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
