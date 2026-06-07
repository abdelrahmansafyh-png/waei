export function isProActive(profile: any) {
  if (profile?.plan !== "pro") return false;
  if (!profile?.pro_until) return true;
  return new Date(profile.pro_until) > new Date();
}

export function getChildName(profile: any) {
  return profile?.nickname || profile?.full_name || "صديقي";
}

export function getChildAvatar(profile: any) {
  return profile?.gender === "female" ? "👧" : "👦";
}
