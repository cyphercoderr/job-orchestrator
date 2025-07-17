import { Injectable, Inject, OnModuleInit, Logger } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { firstValueFrom, Observable } from "rxjs";
import { JobStatus, Target } from "../../shared/constants/job-status";

interface JobData {
  job_id: string;
  test_path: string;
  target: Target;
  app_version_id: string;
  [key: string]: unknown;
}

interface JobSchedulerService {
  updateJobStatus(data: {
    jobId: string;
    status: string;
    logs: string[];
    metadata: {
      agent_id: string;
      updated_at: string;
    };
  }): Observable<unknown>;
}

@Injectable()
export class AgentRunnerService implements OnModuleInit {
  private readonly logger = new Logger(AgentRunnerService.name);
  private jobSchedulerService: JobSchedulerService;

  constructor(@Inject("JOB_SCHEDULER_SERVICE") private client: ClientGrpc) {}

  onModuleInit() {
    this.jobSchedulerService = this.client.getService<JobSchedulerService>(
      "JobSchedulerService",
    );
    this.logger.log("AgentRunnerService initialized");
  }

  async executeJob(jobData: JobData): Promise<void> {
    const { job_id, test_path, target, app_version_id } = jobData;

    this.logger.log(`Executing job: ${job_id} - Suite: ${test_path}`);

    try {
      await this.updateJobStatus(job_id, JobStatus.RUNNING, [
        `Starting execution of ${test_path} on ${target}`,
        `App Version: ${app_version_id}`,
        `Agent: ${process.env.HOSTNAME || "local-agent"}`,
      ]);

      await this.simulateTestExecution(jobData);

      await this.updateJobStatus(job_id, JobStatus.COMPLETED, [
        `Test suite ${test_path} completed successfully`,
        `Execution time: ${this.getRandomExecutionTime()}ms`,
        `Results: All tests passed`,
      ]);

      this.logger.log(`Job ${job_id} completed`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";

      await this.updateJobStatus(job_id, JobStatus.FAILED, [
        `Test execution failed: ${message}`,
        `Error occurred at: ${new Date().toISOString()}`,
      ]);

      this.logger.error(
        `Job ${job_id} failed: ${message}`,
        error instanceof Error ? error.stack : "",
      );

      throw error;
    }
  }

  private async simulateTestExecution(jobData: JobData): Promise<void> {
    const { target, job_id } = jobData;
    const executionTime = this.getExecutionTime(target);

    const progressUpdates = [
      "Initializing test environment...",
      "Installing application...",
      "Setting up test data...",
      "Running test suite...",
      "Collecting results...",
      "Cleaning up resources...",
    ];

    this.logger.debug(
      `Job ${job_id} simulating execution for ${executionTime}ms`,
    );

    for (let i = 0; i < progressUpdates.length; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, executionTime / progressUpdates.length),
      );

      const log = `[${i + 1}/${progressUpdates.length}] ${progressUpdates[i]}`;
      this.logger.verbose(`Job ${job_id}: ${log}`);
      await this.updateJobStatus(job_id, JobStatus.RUNNING, [log]);
    }

    if (Math.random() < 0.1) {
      this.logger.warn(`Job ${job_id} simulating failure`);
      throw new Error("Simulated test failure for demonstration");
    }
  }

  private getExecutionTime(target: Target): number {
    switch (target) {
      case Target.EMULATOR:
        return 5000 + Math.random() * 10000;
      case Target.DEVICE:
        return 10000 + Math.random() * 20000;
      case Target.BROWSERSTACK:
        return 15000 + Math.random() * 30000;
      default: {
        throw new Error(`Unhandled target environment`);
      }
    }
  }

  private getRandomExecutionTime(): number {
    return Math.floor(Math.random() * 30000) + 5000;
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    logs: string[] = [],
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.jobSchedulerService.updateJobStatus({
          jobId,
          status,
          logs,
          metadata: {
            agent_id: process.env.HOSTNAME || "local-agent",
            updated_at: new Date().toISOString(),
          },
        }),
      );
      this.logger.debug(`Updated status for job ${jobId} to ${status}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.error(
        `Failed to update status for job ${jobId}: ${message}`,
        error instanceof Error ? error.stack : "",
      );
    }
  }
}
