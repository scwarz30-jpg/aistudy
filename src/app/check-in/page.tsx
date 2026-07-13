import { getTodayCheckin } from "@/app/dashboard/checkin-state";
import { getSeoulDateString } from "@/lib/date/seoul";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { CheckInForm } from "./CheckInForm";

export default async function CheckInPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return <CheckInForm />;
  }

  const { data: latestCheckins, error: checkinError } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (checkinError) {
    throw new Error("체크인 정보를 불러오지 못했습니다.");
  }

  const todayDate = getSeoulDateString(new Date());
  const todayCheckin = getTodayCheckin(latestCheckins?.[0] ?? null, todayDate);

  return <CheckInForm initialCheckin={todayCheckin} />;
}
