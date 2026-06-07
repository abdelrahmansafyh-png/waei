
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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

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
    const nickname = String(body.nickname || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const age = Number(body.age || 7);
    const gender = body.gender === "female" ? "female" : "male";

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "الاسم والإيميل وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "child",
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
        nickname: nickname || fullName,
        age,
        gender,
        parent_profile_id: parentProfile.id,
        parent_user_id: user.id,
        plan: "free",
        access_code: makeAccessCode(),
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

    return NextResponse.json({
      success: true,
      child: childProfile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
