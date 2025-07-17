import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger";

const CONFIG_FILE = path.resolve(".qgjob.json");
const HISTORY_FILE = path.resolve(".qgjob-history.json");

interface JobConfig {
  org_id?: string;
  app_version_id?: string;
  [key: string]: unknown;
}

export function loadJobConfig(): JobConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as JobConfig;
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(
        { msg: err.message, stack: err.stack },
        "Failed to load job config",
      );
    } else {
      logger.error({ err }, "Failed to load job config: unknown error type");
    }
  }
  return {};
}

export function saveJobToHistory(jobId: string): void {
  let history: string[] = [];
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.every((id) => typeof id === "string")
      ) {
        history = parsed;
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.warn(
        { msg: err.message, stack: err.stack },
        "Failed to read history file",
      );
    } else {
      logger.warn({ err }, "Failed to read history file: unknown error type");
    }
  }

  history.unshift(jobId);
  try {
    fs.writeFileSync(
      HISTORY_FILE,
      JSON.stringify(history.slice(0, 10), null, 2),
      "utf8",
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(
        { msg: err.message, stack: err.stack },
        "Failed to write job history",
      );
    } else {
      logger.error({ err }, "Failed to write job history: unknown error type");
    }
  }
}

export function loadJobHistory(): string[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.every((id) => typeof id === "string")
      ) {
        return parsed;
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(
        { msg: err.message, stack: err.stack },
        "Failed to read job history",
      );
    } else {
      logger.error({ err }, "Failed to read job history: unknown error type");
    }
  }

  return [];
}
