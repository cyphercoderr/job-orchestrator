import { Command } from "commander";
import { api } from "../utils/api";
import { JobStatusResponse } from "../types";
import { logger } from "../utils/logger";

export function registerPollCommand(program: Command) {
  program
    .command("poll")
    .description("Poll job status until it finishes")
    .requiredOption("--job-id <id>", "Job ID to poll")
    .option("--interval <seconds>", "Polling interval in seconds", "10")
    .action(async (options: { jobId: string; interval: string }) => {
      const { jobId, interval } = options;
      const delay = Number(interval) * 1000;
      let finished = false;

      logger.info(`Polling job ${jobId} every ${delay / 1000}s...`);

      while (!finished) {
        try {
          const res = await api.get<JobStatusResponse>(
            `/jobs/status?jobId=${jobId}`,
          );
          const status = res.data.data.status;
          const now = new Date().toISOString();

          logger.info(`${now} - Status: ${status}`);

          const normalized = status.toLowerCase();
          if (normalized === "completed" || normalized === "failed") {
            finished = true;
            logger.info(`Job ${jobId} finished with status: ${status}`);
            process.exit(normalized === "completed" ? 0 : 1);
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Unknown error occurred";
          logger.error(`Polling failed: ${message}`);
          process.exit(2);
        }
      }
    });
}
