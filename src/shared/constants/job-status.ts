export enum JobStatus {
  PENDING = "pending",
  QUEUED = "queued",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum Target {
  EMULATOR = "emulator",
  DEVICE = "device",
  BROWSERSTACK = "browserstack",
}

export const QUEUE_NAMES = {
  JOB_PROCESSING: "job-processing",
  JOB_RETRY: "job-retry",
  JOB_CLEANUP: "job-cleanup",
} as const;
