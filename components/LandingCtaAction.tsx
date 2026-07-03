"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Props = {
  buttonText?: string | null;
  buttonLink?: string | null;
};

export default function LandingCtaAction({
  buttonText = "إنشاء حساب",
  buttonLink = "/register",
}: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setLoggedIn(Boolean(data.user));
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
      setReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Link
      href={loggedIn ? "/dashboard" : buttonLink || "/register"}
      className="rounded-full bg-[var(--rashid-color-ffd54a)] px-9 py-4 text-lg font-black text-[var(--rashid-color-14224a)]"
    >
      {!ready
        ? "..."
        : loggedIn
          ? "الدخول للوحة التحكم"
          : buttonText || "إنشاء حساب"}
    </Link>
  );
}