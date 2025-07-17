import { Command } from "commander";
import { api } from "../utils/api";
import { JobStatusResponse } from "../types";
import { logger } from "../utils/logger";

export function registerStatusCommand(program: Command) {
  program
    .command("status")
    .description("Check job status by ID")
    .requiredOption("--job-id <jobId>", "Job ID")
    .action(async (options: { jobId: string }) => {
      const jobId = options.jobId;
      try {
        logger.info(`Fetching status for job: ${jobId}`);
        const res = await api.get<JobStatusResponse>(
          `/jobs/status?jobId=${jobId}`,
        );

        const job = res.data.data;
        logger.info(`Status for job: ${job.job_id}`);
        logger.info(`Organization: ${job.org_id}`);
        logger.info(`App Version: ${job.app_version_id}`);
        logger.info(`Test Path: ${job.test_path}`);
        logger.info(`Target: ${job.target}`);
        logger.info(`Priority: ${job.priority}`);
        logger.info(`Status: ${job.status}`);
        logger.info(`Created At: ${job.created_at}`);
        logger.info(`Updated At: ${job.updated_at}`);

        if (job.logs?.length) {
          logger.info(`Logs:\n${job.logs.join("\n")}`);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        logger.error(`Failed to fetch job status: ${message}`);
      }
    });
}
