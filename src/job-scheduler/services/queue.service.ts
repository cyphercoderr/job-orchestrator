import { Injectable, Logger } from "@nestjs/common"; // <- Add Logger
import { Job, Queue } from "bull";
import { QUEUE_NAMES } from "../../shared/constants/job-status";
import { InjectQueue } from "@nestjs/bull";

interface JobData {
  app_version_id: string;
  test_path: string;
  target: string;
  priority: number;
}

interface ExtendedJobData extends JobData {
  org_id: string;
  job_id: string;
  group_size: number;
  group_jobs: string[];
}

interface CleanupJobData {
  job_id: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name); // <- Logger instance

  constructor(
    @InjectQueue(QUEUE_NAMES.JOB_PROCESSING)
    private readonly jobQueue: Queue<JobData>,

    @InjectQueue(QUEUE_NAMES.JOB_RETRY)
    private readonly retryQueue: Queue<JobData>,

    @InjectQueue(QUEUE_NAMES.JOB_CLEANUP)
    private readonly cleanupQueue: Queue<CleanupJobData>,
  ) {
    this.logger.log("QueueService initialized");
  }

  async addJobToQueue(jobData: ExtendedJobData): Promise<Job<JobData>> {
    const delay =
      jobData.group_size > 1 ? this.calculateGroupDelay(jobData.group_size) : 0;

    const options = {
      priority: 10 - jobData.priority,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
      delay,
    };

    this.logger.log(
      `Adding job ${jobData.job_id} to processing queue with priority ${
        jobData.priority
      } and delay ${delay}ms`,
    );

    return this.jobQueue.add("process-job", jobData, options);
  }

  async addRetryJob(jobData: ExtendedJobData, delay = 5000) {
    this.logger.warn(
      `Retrying job ${jobData?.job_id ?? "unknown"} after ${delay}ms`,
    );

    return this.retryQueue.add("retry-job", jobData, {
      delay,
      attempts: 1,
    });
  }

  async scheduleCleanup(jobId: string, delay: number = 24 * 60 * 60 * 1000) {
    this.logger.log(
      `Scheduling cleanup for job ${jobId} after ${delay / 1000}s`,
    );

    return this.cleanupQueue.add(
      "cleanup-job",
      { job_id: jobId },
      {
        delay,
        attempts: 1,
      },
    );
  }

  async getQueueStats() {
    this.logger.log("Fetching queue statistics");

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.jobQueue.getWaiting(),
      this.jobQueue.getActive(),
      this.jobQueue.getCompleted(),
      this.jobQueue.getFailed(),
      this.jobQueue.getDelayed(),
    ]);

    const stats = {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total:
        waiting.length +
        active.length +
        completed.length +
        failed.length +
        delayed.length,
    };

    this.logger.debug(`Queue stats: ${JSON.stringify(stats)}`);
    return stats;
  }

  private calculateGroupDelay(groupSize: number): number {
    const delay = Math.floor(Math.random() * groupSize * 1000);
    this.logger.verbose(
      `Calculated group delay: ${delay}ms for group size ${groupSize}`,
    );
    return delay;
  }
}
