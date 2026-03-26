import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runIngestPreview, type IngestRunResult } from "@/lib/ingest";
import { canUseLocalIngestState } from "@/lib/ingest/state";

export type ScheduledIngestRunSummary = {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  ok: boolean;
  candidateCount: number;
  failureCount: number;
  diagnostics: IngestRunResult["diagnostics"];
};

const INGEST_RUN_STATE_PATH = path.join(process.cwd(), "data", "gdi-ingest-run.json");

async function ensureStateDir() {
  if (!canUseLocalIngestState()) return;
  await mkdir(path.dirname(INGEST_RUN_STATE_PATH), { recursive: true });
}

async function writeRunSummary(summary: ScheduledIngestRunSummary) {
  if (!canUseLocalIngestState()) return;
  await ensureStateDir();
  await writeFile(INGEST_RUN_STATE_PATH, JSON.stringify(summary, null, 2), "utf8");
}

async function persistRunSummary(summary: ScheduledIngestRunSummary) {
  try {
    await writeRunSummary(summary);
  } catch (error) {
    console.warn("[scheduled-ingest] unable to persist run summary", error);
  }
}

export async function runScheduledIngest(): Promise<ScheduledIngestRunSummary> {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const result = await runIngestPreview();
  const completedAt = new Date().toISOString();
  const failureCount = result.diagnostics.filter((item) => !item.ok).length;

  const summary: ScheduledIngestRunSummary = {
    startedAt,
    completedAt,
    durationMs: Date.now() - startedAtMs,
    ok: failureCount === 0,
    candidateCount: result.candidates.length,
    failureCount,
    diagnostics: result.diagnostics,
  };

  await persistRunSummary(summary);
  console.info("[scheduled-ingest]", JSON.stringify(summary));

  return summary;
}

export function isValidIngestScheduleSecret(value: string | null): boolean {
  const expected = process.env.CRON_SECRET ?? process.env.INGEST_SCHEDULE_SECRET;
  return Boolean(expected && value && value === expected);
}
