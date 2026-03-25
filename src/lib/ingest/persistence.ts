import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CandidateEvent } from "@/lib/ingest/events";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

export type PersistedCandidateStatus = "pending" | "accepted" | "rejected";

export type PersistedCandidate = CandidateEvent & {
  id: string;
  status: PersistedCandidateStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
};

type LocalStore = {
  candidates: PersistedCandidate[];
};

type SupabaseCandidateRow = {
  candidate_key: string;
  title: string;
  source: string;
  source_key: string;
  source_url: string;
  occurred_at: string;
  impact_dimension: CandidateEvent["impactDimension"];
  confidence: number;
  evidence_type: CandidateEvent["evidenceType"];
  raw_category: string | null;
  raw_region: string | null;
  status: PersistedCandidateStatus;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
};

function comparePersistedCandidateOrder(
  left: Pick<PersistedCandidate, "occurredAt" | "updatedAt">,
  right: Pick<PersistedCandidate, "occurredAt" | "updatedAt">
): number {
  return right.occurredAt.localeCompare(left.occurredAt) || right.updatedAt.localeCompare(left.updatedAt);
}

function getStorePath(): string {
  return path.join(process.cwd(), "data", "ingest-candidates.json");
}

export function getCandidateId(candidate: CandidateEvent): string {
  return Buffer.from(
    [
      candidate.sourceKey,
      candidate.sourceUrl,
      candidate.occurredAt,
      candidate.impactDimension,
      candidate.title.trim().toLowerCase(),
    ].join("|")
  )
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("/", "_")
    .replaceAll("+", "-");
}

function toPersistedCandidate(candidate: CandidateEvent, existing?: PersistedCandidate): PersistedCandidate {
  const now = new Date().toISOString();

  return {
    ...candidate,
    id: existing?.id ?? getCandidateId(candidate),
    status: existing?.status ?? "pending",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    reviewedAt: existing?.reviewedAt,
  };
}

function mapSupabaseRow(row: SupabaseCandidateRow): PersistedCandidate {
  return {
    id: row.candidate_key,
    title: row.title,
    source: row.source,
    sourceKey: row.source_key,
    sourceUrl: row.source_url,
    occurredAt: row.occurred_at,
    impactDimension: row.impact_dimension,
    confidence: Number(row.confidence),
    evidenceType: row.evidence_type,
    rawCategory: row.raw_category ?? undefined,
    rawRegion: row.raw_region ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at ?? undefined,
  };
}

async function ensureStoreDir() {
  await mkdir(path.dirname(getStorePath()), { recursive: true });
}

async function readLocalStore(): Promise<LocalStore> {
  try {
    const raw = await readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return { candidates: parsed.candidates ?? [] };
  } catch {
    return { candidates: [] };
  }
}

async function writeLocalStore(store: LocalStore) {
  await ensureStoreDir();
  await writeFile(getStorePath(), JSON.stringify(store, null, 2), "utf8");
}

export async function listPersistedCandidates(): Promise<PersistedCandidate[]> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    const store = await readLocalStore();
    return store.candidates.sort(comparePersistedCandidateOrder);
  }

  const { data, error } = await supabase
    .from("event_candidates")
    .select(
      "candidate_key,title,source,source_key,source_url,occurred_at,impact_dimension,confidence,evidence_type,raw_category,raw_region,status,created_at,updated_at,reviewed_at"
    )
    .order("occurred_at", { ascending: false });

  if (error) {
    const store = await readLocalStore();
    return store.candidates.sort(comparePersistedCandidateOrder);
  }

  return ((data ?? []) as SupabaseCandidateRow[]).map(mapSupabaseRow).sort(comparePersistedCandidateOrder);
}

export async function persistCandidates(candidates: CandidateEvent[]): Promise<PersistedCandidate[]> {
  const existing = await listPersistedCandidates();
  const existingById = new Map(existing.map((candidate) => [candidate.id, candidate]));
  const upserts = candidates.map((candidate) =>
    toPersistedCandidate(candidate, existingById.get(getCandidateId(candidate)))
  );
  const merged = new Map(existing.map((candidate) => [candidate.id, candidate]));
  for (const candidate of upserts) {
    merged.set(candidate.id, candidate);
  }
  const mergedCandidates = Array.from(merged.values()).sort(comparePersistedCandidateOrder);
  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    await writeLocalStore({ candidates: mergedCandidates });
    return mergedCandidates;
  }

  const payload = upserts.map((candidate) => ({
    candidate_key: candidate.id,
    title: candidate.title,
    source: candidate.source,
    source_key: candidate.sourceKey,
    source_url: candidate.sourceUrl,
    occurred_at: candidate.occurredAt,
    impact_dimension: candidate.impactDimension,
    confidence: candidate.confidence,
    evidence_type: candidate.evidenceType,
    raw_category: candidate.rawCategory ?? null,
    raw_region: candidate.rawRegion ?? null,
    status: candidate.status,
    reviewed_at: candidate.reviewedAt ?? null,
    updated_at: candidate.updatedAt,
  }));

  const { error } = await supabase
    .from("event_candidates")
    .upsert(payload, { onConflict: "candidate_key" });

  if (error) {
    await writeLocalStore({ candidates: mergedCandidates });
    return mergedCandidates;
  }

  return mergedCandidates;
}

export async function updatePersistedCandidateStatus(
  candidateId: string,
  status: PersistedCandidateStatus
): Promise<void> {
  const reviewedAt = status === "pending" ? undefined : new Date().toISOString();
  const supabase = getSupabaseServiceRoleClient();

  if (!supabase) {
    const store = await readLocalStore();
    await writeLocalStore({
      candidates: store.candidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status,
              updatedAt: new Date().toISOString(),
              reviewedAt,
            }
          : candidate
      ),
    });
    return;
  }

  const { error } = await supabase
    .from("event_candidates")
    .update({
      status,
      updated_at: new Date().toISOString(),
      reviewed_at: reviewedAt ?? null,
    })
    .eq("candidate_key", candidateId);

  if (error) {
    const store = await readLocalStore();
    await writeLocalStore({
      candidates: store.candidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              status,
              updatedAt: new Date().toISOString(),
              reviewedAt,
            }
          : candidate
      ),
    });
  }
}
