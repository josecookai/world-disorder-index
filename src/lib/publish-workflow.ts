import { getLatestRecord } from "@/lib/api/data";
import { getReviewedDraft } from "@/lib/review-workflow";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function publishLatestRecord() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return {
      ok: false as const,
      status: 500,
      message:
        "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY to publish records.",
    };
  }

  const latest = (await getReviewedDraft()) ?? getLatestRecord();
  const payload = {
    date: latest.date,
    score_total: latest.score_total,
    label_en: latest.label_en,
    label_zh: latest.label_zh,
    wow_change: latest.wow_change,
    military_conflict: latest.military_conflict,
    great_power_tension: latest.great_power_tension,
    trade_sanctions: latest.trade_sanctions,
    energy_shipping: latest.energy_shipping,
    nuclear_miscalculation: latest.nuclear_miscalculation,
    drivers: latest.drivers,
    summary: latest.summary,
    score_reason: latest.score_reason ?? null,
    reviewed_by: latest.reviewed_by ?? null,
    status: "published",
    published_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("gdi_records").upsert(payload, { onConflict: "date" });
  if (error) {
    return {
      ok: false as const,
      status: 500,
      message: error.message,
    };
  }

  return {
    ok: true as const,
    status: 200,
    message: "Published latest record to Supabase.",
  };
}
