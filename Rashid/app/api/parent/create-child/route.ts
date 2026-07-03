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

function makeAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

function childEmail(username: string) {
  return `child.${username}@children.rashid.app`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "غير مصرح" },
        { status: 401 }
      );
    }

    const supabase = adminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: "جلسة غير صالحة" },
        { status: 401 }
      );
    }

    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "parent")
      .maybeSingle();

    if (!parentProfile) {
      return NextResponse.json(
        { success: false, message: "هذا الحساب ليس ولي أمر" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const username = normalizeUsername(String(body.username || ""));
    const rawAge = Number(body.age || 7);
    const age = Math.min(9, Math.max(5, rawAge));
    const gender = body.gender === "female" ? "female" : "male";

    if (!fullName || !username) {
      return NextResponse.json(
        { success: false, message: "اسم الطفل واسم المستخدم مطلوبان" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: "اسم المستخدم مستخدم مسبقًا" },
        { status: 400 }
      );
    }

    const accessCode = makeAccessCode();
    const email = childEmail(username);

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: accessCode,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "child",
          username,
        },
      });

    if (createError || !created.user) {
      return NextResponse.json(
        {
          success: false,
          message: createError?.message || "فشل إنشاء حساب الطفل",
        },
        { status: 400 }
      );
    }

    const { data: childProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: created.user.id,
        role: "child",
        full_name: fullName,
        username,
        age,
        gender,
        parent_profile_id: parentProfile.id,
        parent_user_id: user.id,
        plan: "free",
        access_code: accessCode,
        xp: 0,
        completed_programs: 0,
      })
      .select("*")
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(created.user.id);
      return NextResponse.json(
        { success: false, message: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, child: childProfile });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
