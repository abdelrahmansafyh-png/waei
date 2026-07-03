"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ChildDashboard from "@/components/child/ChildDashboard";
import ParentDashboard from "@/components/parent/ParentDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      router.push("/login");
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  }
  
  if (profile.role === "child") return <ChildDashboard profile={profile} />;

  return <ParentDashboard profile={profile} />;

}