import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function toNumber(value: any, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function calculateXp(score: number, maxScore: number, percentage: number) {
  if (maxScore > 0) return Math.max(0, score) * 10;
  if (percentage >= 90) return 150;
  if (percentage >= 70) return 120;
  if (percentage > 0) return 100;
  return 0;
}

function getContentKind(contentType: string) {
  if (contentType === "interactive_story" || contentType === "interactive_stories") return "story";
  if (contentType === "iframe" || contentType === "zip_game") return "game";
  return "content";
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

    const programId = String(body.program_id || "").trim();
    const contentId = String(body.content_id || "").trim();
    const durationSeconds = toNumber(body.duration_seconds, 0);
    const lastPosition = toNumber(body.last_position, 0);
    const result = body.result || {};
    const answers = Array.isArray(result.answers)
      ? result.answers
      : Array.isArray(body.answers)
      ? body.answers
      : [];

    if (!programId || !contentId) {
      return NextResponse.json(
        { success: false, message: "program_id و content_id مطلوبان" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, user_id, role, parent_profile_id, xp")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "child") {
      return NextResponse.json(
        { success: false, message: "هذا الحساب ليس حساب طفل" },
        { status: 403 }
      );
    }

    const { data: content } = await supabase
      .from("tab_contents")
      .select("id, tab_id, content_type, iframe_url, program_tabs!inner(program_id)")
      .eq("id", contentId)
      .eq("program_tabs.program_id", programId)
      .maybeSingle();

    if (!content) {
      return NextResponse.json(
        { success: false, message: "المحتوى غير تابع لهذا البرنامج" },
        { status: 400 }
      );
    }

    const score = toNumber(result.score ?? result.correct ?? result.correctAnswers ?? result.correctCount, 0);
    const maxScore = toNumber(result.maxScore ?? result.max_score ?? result.total ?? result.totalQuestions ?? result.max_score, 0);
    const rawPercentage = toNumber(result.percentage, maxScore > 0 ? Math.round((score / maxScore) * 100) : 0);
    const percentage = Math.max(0, Math.min(100, rawPercentage));

    await supabase.from("game_attempts").insert({
      child_profile_id: profile.id,
      parent_profile_id: profile.parent_profile_id || null,
      content_id: contentId,
      program_id: programId,
      score,
      max_score: maxScore,
      percentage,
      completed: true,
      duration_seconds: durationSeconds,
      attempt_number: 1,
      result,
      answers,
    });

    const { data: existingProgress } = await supabase
      .from("child_content_progress")
      .select("id, xp_awarded, xp_earned, score, max_score, percentage")
      .eq("child_profile_id", profile.id)
      .eq("content_id", contentId)
      .maybeSingle();

    const alreadyAwarded = Boolean(existingProgress?.xp_awarded);
    const xpEarned = alreadyAwarded
      ? toNumber(existingProgress?.xp_earned, 0)
      : calculateXp(score, maxScore, percentage);

    const progressPayload = {
      child_profile_id: profile.id,
      program_id: programId,
      content_id: contentId,
      content_type: getContentKind(String(content.content_type || "")),
      completed: true,
      score: Math.max(score, toNumber(existingProgress?.score, 0)),
      max_score: Math.max(maxScore, toNumber(existingProgress?.max_score, 0)),
      percentage: Math.max(percentage, toNumber(existingProgress?.percentage, 0)),
      xp_earned: xpEarned,
      xp_awarded: true,
      last_position: lastPosition,
      updated_at: new Date().toISOString(),
    };

    if (existingProgress?.id) {
      const { error: updateProgressError } = await supabase
        .from("child_content_progress")
        .update(progressPayload)
        .eq("id", existingProgress.id);

      if (updateProgressError) {
        return NextResponse.json(
          { success: false, message: updateProgressError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: insertProgressError } = await supabase
        .from("child_content_progress")
        .insert(progressPayload);

      if (insertProgressError) {
        return NextResponse.json(
          { success: false, message: insertProgressError.message },
          { status: 500 }
        );
      }
    }

    let nextXp = toNumber(profile.xp, 0);
    let awardedNow = false;

    if (!alreadyAwarded && xpEarned > 0) {
      awardedNow = true;
      nextXp += xpEarned;

      const { error: xpError } = await supabase
        .from("profiles")
        .update({ xp: nextXp })
        .eq("id", profile.id);

      if (xpError) {
        return NextResponse.json(
          { success: false, message: xpError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      xp_earned: xpEarned,
      awarded_now: awardedNow,
      total_xp: nextXp,
      already_awarded: alreadyAwarded,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "فشل حفظ نتيجة اللعبة" },
      { status: 500 }
    );
  }
}

