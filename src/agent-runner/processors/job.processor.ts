import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import type { Job } from "bull";
import { QUEUE_NAMES, Target } from "../../shared/constants/job-status";
import { AgentRunnerService } from "../services/agent-runner.service";

interface JobData {
  job_id: string;
  test_path: string;
  target: Target;
  app_version_id: string;
  [key: string]: unknown;
}

@Processor(QUEUE_NAMES.JOB_PROCESSING)
export class JobProcessor {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(private readonly agentRunnerService: AgentRunnerService) {}

  @Process("process-job")
  async handleJobProcessing(job: Job<JobData>) {
    const jobId = job.data.job_id;
    this.logger.log(`Processing job: ${jobId}`);

    try {
      await this.agentRunnerService.executeJob(job.data);
      this.logger.log(`Job ${jobId} completed successfully`);
    } catch (error) {
      this.logger.error(
        `Job ${jobId} failed`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  @Process("retry-job")
  async handleJobRetry(job: Job<JobData>) {
    const jobId = job.data.job_id;
    this.logger.warn(`Retrying job: ${jobId}`);
    return this.handleJobProcessing(job);
  }

  @Process("cleanup-job")
  handleJobCleanup(job: Job<JobData>) {
    const jobId = job.data.job_id;
    this.logger.log(`Cleaning up job: ${jobId}`);
    // Optional: implement cleanup logic
  }
}
