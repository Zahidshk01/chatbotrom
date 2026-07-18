import { supabase } from "@/integrations/supabase/client";
import { baselineFollowCounts } from "@/lib/follow-baseline";

export async function isFollowingUser(targetId: string): Promise<boolean> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid || uid === targetId) return false;
  const { data } = await (supabase as any)
    .from("user_user_follows")
    .select("follower_id")
    .eq("follower_id", uid)
    .eq("followed_id", targetId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollowUser(targetId: string): Promise<boolean> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid || uid === targetId) return false;
  const currently = await isFollowingUser(targetId);
  if (currently) {
    await (supabase as any)
      .from("user_user_follows")
      .delete()
      .eq("follower_id", uid)
      .eq("followed_id", targetId);
    return false;
  }
  await (supabase as any)
    .from("user_user_follows")
    .insert({ follower_id: uid, followed_id: targetId });
  return true;
}

export async function getUserFollowCounts(userId: string) {
  const [{ count: followers }, { count: following }] = await Promise.all([
    (supabase as any)
      .from("user_user_follows")
      .select("*", { count: "exact", head: true })
      .eq("followed_id", userId),
    (supabase as any)
      .from("user_user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);
  const base = baselineFollowCounts(userId);
  return {
    followers: (followers ?? 0) + base.followers,
    following: (following ?? 0) + base.following,
  };
}
