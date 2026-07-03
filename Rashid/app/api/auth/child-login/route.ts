import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = normalizeUsername(String(body.username || ""));
    const accessCode = String(body.access_code || "").trim().toUpperCase();

    if (!username || !accessCode) {
      return NextResponse.json(
        { success: false, message: "اسم المستخدم وكود الدخول مطلوبان" },
        { status: 400 }
      );
    }

    const supabase = adminClient();

    const { data: childProfile } = await supabase
      .from("profiles")
      .select("id, user_id, role, username, access_code, parent_profile_id")
      .eq("role", "child")
      .eq("username", username)
      .eq("access_code", accessCode)
      .maybeSingle();

    if (!childProfile?.user_id) {
      return NextResponse.json(
        { success: false, message: "بيانات دخول الطفل غير صحيحة" },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      childProfile.user_id
    );

    if (userError || !userData.user?.email) {
      return NextResponse.json(
        { success: false, message: "تعذر إيجاد حساب الطفل" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      email: userData.user.email,
      access_code: accessCode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
