"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = {
  name: string;
  email?: string | null;
  initial: string;
} | null;

export default function LandingAuthActions() {
  const [authUser, setAuthUser] = useState<AuthState>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!mounted) return;

      if (!user) {
        setAuthUser(null);
        setLoading(false);
        return;
      }

      let profile: any = null;

      try {
        const selectFields = "id,user_id,role,full_name,nickname";

        const { data: byUserId, error: byUserIdError } = await supabase
          .from("profiles")
          .select(selectFields)
          .eq("user_id", user.id)
          .maybeSingle();

        if (byUserIdError) {
          console.error("profile by user_id error", byUserIdError);
        }

        profile = byUserId;

        if (!profile) {
          const { data: byId, error: byIdError } = await supabase
            .from("profiles")
            .select(selectFields)
            .eq("id", user.id)
            .maybeSingle();

          if (byIdError) {
            console.error("profile by id error", byIdError);
          }

          profile = byId;
        }
      } catch (error) {
        console.error("profile load error", error);
        profile = null;
      }

      const clean = (value: any) =>
        typeof value === "string" && value.trim() ? value.trim() : "";

      const email = user.email || null;

      let name =
        clean(profile?.full_name) ||
        clean(profile?.nickname) ||
        clean(user.user_metadata?.full_name) ||
        clean(user.user_metadata?.name);

      if (!name) {
        name =
          profile?.role === "parent"
            ? "ولي الأمر"
            : profile?.role === "child"
              ? "الطفل"
              : "المستخدم";
      }

      setAuthUser({
        name,
        email,
        initial: name.trim().charAt(0) || "و",
      });

      setLoading(false);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setOpen(false);
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="h-12 w-36 animate-pulse rounded-full bg-[var(--rashid-color-42bfa8)]/20" />
    );
  }

  if (!authUser) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-[var(--rashid-color-42bfa8)] px-8 py-3 font-black text-white shadow-lg shadow-teal-100 transition hover:-translate-y-1"
      >
        تسجيل الدخول
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full border border-white/70 bg-white/95 px-3 py-2 shadow-lg shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-xl"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--rashid-color-42bfa8)] to-[var(--rashid-color-0b4d6b)] text-lg font-black text-white shadow-md">
          {authUser.initial}
        </span>

        <span className="hidden max-w-[150px] truncate text-sm font-black text-[var(--rashid-color-0b4d6b)] sm:block">
          {authUser.name}
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`h-5 w-5 text-[var(--rashid-color-0b4d6b)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path
            d="M7 10l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className={`absolute left-0 top-full z-[80] mt-3 w-64 origin-top-left overflow-hidden rounded-[1.6rem] border border-white bg-white p-2 text-right shadow-2xl shadow-slate-300/60 transition-all duration-200 ${
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="mb-2 rounded-[1.2rem] bg-[var(--rashid-color-f4faf8)] px-4 py-3">
          <p className="text-xs font-bold text-[var(--rashid-color-2d9b87)]">
            أهلاً بك
          </p>

          <p className="mt-1 truncate text-base font-black text-[var(--rashid-color-0b4d6b)]">
            {authUser.name}
          </p>

          {authUser.email ? (
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {authUser.email}
            </p>
          ) : null}
        </div>

        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-[var(--rashid-color-0b4d6b)] transition hover:bg-[var(--rashid-color-f4faf8)]"
        >
          <span>🏠</span>
          <span>لوحة التحكم</span>
        </Link>

        <Link
          href="/child/programs"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-[var(--rashid-color-0b4d6b)] transition hover:bg-[var(--rashid-color-f4faf8)]"
        >
          <span>📚</span>
          <span>البرامج</span>
        </Link>

        <div className="my-2 h-px bg-slate-100" />

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right text-sm font-black text-red-600 transition hover:bg-red-50"
        >
          <span>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
