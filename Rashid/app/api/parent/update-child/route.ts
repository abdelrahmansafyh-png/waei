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

function makeAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 });
    }

    const supabase = adminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ success: false, message: "جلسة غير صالحة" }, { status: 401 });
    }

    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "parent")
      .maybeSingle();

    if (!parentProfile) {
      return NextResponse.json({ success: false, message: "هذا الحساب ليس ولي أمر" }, { status: 403 });
    }

    const body = await req.json();
    const childId = String(body.child_id || "").trim();
    const fullName = String(body.full_name || "").trim();
    const username = normalizeUsername(String(body.username || ""));
    const rawAge = Number(body.age || 7);
    const age = Math.min(9, Math.max(5, rawAge));
    const gender = body.gender === "female" ? "female" : "male";
    const regenerateCode = body.regenerate_code === true;

    if (!childId || !fullName || !username) {
      return NextResponse.json({ success: false, message: "البيانات المطلوبة غير مكتملة" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ success: false, message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" }, { status: 400 });
    }

    const { data: childProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", childId)
      .eq("role", "child")
      .eq("parent_profile_id", parentProfile.id)
      .maybeSingle();

    if (!childProfile) {
      return NextResponse.json({ success: false, message: "لم يتم العثور على الطفل" }, { status: 404 });
    }

    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", childId)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json({ success: false, message: "اسم المستخدم مستخدم مسبقًا" }, { status: 400 });
    }

    const accessCode = regenerateCode ? makeAccessCode() : childProfile.access_code;

    const { data: updatedChild, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username,
        age,
        gender,
        access_code: accessCode,
      })
      .eq("id", childId)
      .eq("parent_profile_id", parentProfile.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 400 });
    }

    if (regenerateCode && childProfile.user_id) {
      await supabase.auth.admin.updateUserById(childProfile.user_id, {
        password: accessCode,
        user_metadata: {
          full_name: fullName,
          role: "child",
          username,
        },
      });
    } else if (childProfile.user_id) {
      await supabase.auth.admin.updateUserById(childProfile.user_id, {
        user_metadata: {
          full_name: fullName,
          role: "child",
          username,
        },
      });
    }

    return NextResponse.json({ success: true, child: updatedChild });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
