
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
    const accessCode = String(body.access_code || "").trim().toUpperCase();

    if (!accessCode) {
      return NextResponse.json(
        { success: false, message: "كود الربط مطلوب" },
        { status: 400 }
      );
    }

    const { data: childProfile, error: childError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "child")
      .eq("access_code", accessCode)
      .maybeSingle();

    if (childError || !childProfile) {
      return NextResponse.json(
        { success: false, message: "كود الربط غير صحيح" },
        { status: 404 }
      );
    }

    if (childProfile.parent_profile_id) {
      return NextResponse.json(
        { success: false, message: "هذا الطفل مربوط مسبقًا بولي أمر" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        parent_profile_id: parentProfile.id,
        parent_user_id: user.id,
      })
      .eq("id", childProfile.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      child: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
