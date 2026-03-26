export class IngestStateUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestStateUnavailableError";
  }
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function canUseLocalIngestState() {
  if (process.env.ALLOW_LOCAL_INGEST_STATE === "true") return true;
  if (process.env.ALLOW_LOCAL_INGEST_STATE === "false") return false;

  return !isProductionRuntime();
}

export function assertLocalIngestStateAvailable(purpose: string) {
  if (!canUseLocalIngestState()) {
    throw new IngestStateUnavailableError(
      `Local ingest state is disabled in production for ${purpose}. Configure durable storage instead.`
    );
  }
}
