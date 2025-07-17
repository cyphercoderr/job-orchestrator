import { Command } from "commander";
import { api } from "../utils/api";
import { CLIOptions, JobData, SubmitJobResponse } from "../types";
import { saveJobToHistory } from "../utils/config";
import { logger } from "../utils/logger";

export function registerSubmitCommand(program: Command) {
  program
    .command("submit")
    .description("Submit a new test job")
    .requiredOption("--org-id <org>", "Organization ID")
    .requiredOption("--app-version-id <id>", "App version ID")
    .requiredOption("--test <path>", "Path to test file")
    .requiredOption(
      "--target <target>",
      "Target (emulator, device, browserstack)",
    )
    .option("--priority <priority>", "Job priority (1-10)", "5")
    .action(async (options: CLIOptions) => {
      try {
        const jobData: JobData = {
          org_id: options.orgId,
          app_version_id: options.appVersionId,
          test_path: options.test,
          priority: parseInt(options.priority, 10),
          target: options.target,
        };

        logger.info("Submitting job...");
        logger.debug({ jobData }, "Job payload");

        const res = await api.post<SubmitJobResponse>("/jobs/submit", jobData);
        const jobId = res.data?.data?.job_id;

        if (jobId) {
          logger.info(`Job submitted successfully: ${jobId}`);
          saveJobToHistory(jobId);
        } else {
          logger.error("Failed to submit job: No job ID returned");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error submitting job";
        logger.error(`Error submitting job: ${message}`);
      }
    });
}
