
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

function isFreePlan(plan: any) {
  const priceNumber = Number(String(plan?.price || "0").replace(/[^0-9.]/g, ""));

  return (
    priceNumber === 0 ||
    plan?.price === "0" ||
    plan?.name?.toLowerCase() === "free" ||
    plan?.name === "مجاني"
  );
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

    const body = await req.json();
    const planId = String(body.plan_id || "");
    const targetProfileId = String(body.target_profile_id || "");

    if (!planId || !targetProfileId) {
      return NextResponse.json(
        { success: false, message: "الخطة والحساب مطلوبان" },
        { status: 400 }
      );
    }

    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!requesterProfile) {
      return NextResponse.json(
        { success: false, message: "لم يتم العثور على حساب المستخدم" },
        { status: 404 }
      );
    }

    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "الخطة غير موجودة أو غير مفعلة" },
        { status: 404 }
      );
    }

    if (isFreePlan(plan)) {
      return NextResponse.json(
        { success: false, message: "الخطة المجانية لا تحتاج إلى تفعيل" },
        { status: 400 }
      );
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetProfileId)
      .maybeSingle();

    if (!targetProfile) {
      return NextResponse.json(
        { success: false, message: "الحساب المطلوب غير موجود" },
        { status: 404 }
      );
    }

    const isChildActivatingSelf =
      requesterProfile.role === "child" && requesterProfile.id === targetProfile.id;

    const isParentActivatingLinkedChild =
      requesterProfile.role === "parent" &&
      targetProfile.role === "child" &&
      (targetProfile.parent_profile_id === requesterProfile.id ||
        targetProfile.parent_user_id === user.id);

    if (!isChildActivatingSelf && !isParentActivatingLinkedChild) {
      return NextResponse.json(
        { success: false, message: "لا تملك صلاحية تفعيل هذه الخطة لهذا الحساب" },
        { status: 403 }
      );
    }

    const until = new Date();
    until.setDate(until.getDate() + (plan.duration_days || 30));

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        plan: "pro",
        pro_until: until.toISOString(),
      })
      .eq("id", targetProfile.id)
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
      profile: updatedProfile,
      plan,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "حدث خطأ أثناء التفعيل" },
      { status: 500 }
    );
  }
}
