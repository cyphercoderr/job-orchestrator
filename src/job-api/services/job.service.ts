import { Injectable, Inject, type OnModuleInit, Logger } from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import type { Model } from "mongoose";
import { firstValueFrom, Observable } from "rxjs";
import { Job, type JobDocument } from "../../shared/schemas/job.schema";
import { JobStatus } from "../../shared/constants/job-status";
import { v4 as uuidv4 } from "uuid";
import {
  SubmitJobRequest,
  SubmitJobResponse,
  GetJobStatusRequest,
  GetJobStatusResponse,
  GetJobsByGroupRequest,
  GetJobsByGroupResponse,
  UpdateJobStatusRequest,
  UpdateJobStatusResponse,
} from "src/proto/job";
import { InjectModel } from "@nestjs/mongoose";
import { SubmitJobDto } from "src/shared/dto/job.dto";

interface JobSchedulerService {
  submitJob(data: SubmitJobRequest): Observable<SubmitJobResponse>;
  getJobStatus(data: GetJobStatusRequest): Observable<GetJobStatusResponse>;
  getJobsByGroup(
    data: GetJobsByGroupRequest,
  ): Observable<GetJobsByGroupResponse>;
  updateJobStatus(
    data: UpdateJobStatusRequest,
  ): Observable<UpdateJobStatusResponse>;
}

@Injectable()
export class JobService implements OnModuleInit {
  private readonly logger = new Logger(JobService.name);
  private jobSchedulerService: JobSchedulerService;

  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @Inject("JOB_SCHEDULER_SERVICE") private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.logger.log("Initializing JobService and fetching JobSchedulerService");
    this.jobSchedulerService = this.client.getService<JobSchedulerService>(
      "JobSchedulerService",
    );
  }

  async submitJob(submitJobDto: SubmitJobDto) {
    const jobId: string = uuidv4();
    this.logger.log(`Submitting job with ID: ${jobId}`);

    const existingJob = await this.checkDuplicateJob(submitJobDto);
    if (existingJob) {
      this.logger.warn(`Duplicate job detected: ${existingJob.job_id}`);
      return {
        job_id: existingJob.job_id,
        status: existingJob.status,
        message: "Duplicate job found, returning existing job",
      };
    }

    const job = new this.jobModel({
      job_id: jobId,
      ...submitJobDto,
      status: JobStatus.PENDING,
      logs: [`Job ${jobId} created at ${new Date().toISOString()}`],
    });

    await job.save();
    this.logger.log(`Job ${jobId} saved to DB.`);

    try {
      const grpcPayload: SubmitJobRequest = {
        jobId,
        orgId: submitJobDto.org_id,
        appVersionId: submitJobDto.app_version_id,
        testPath: submitJobDto.test_path,
        priority: submitJobDto.priority ?? 5,
        target: submitJobDto.target,
      };

      const response = await firstValueFrom(
        this.jobSchedulerService.submitJob(grpcPayload),
      );

      await this.jobModel.updateOne(
        { job_id: jobId },
        {
          status: JobStatus.QUEUED,
          $push: { logs: `Job ${jobId} queued at ${new Date().toISOString()}` },
        },
      );

      this.logger.log(`Job ${jobId} successfully submitted and queued.`);

      return {
        job_id: jobId,
        status: JobStatus.QUEUED,
        scheduler_response: response,
        message: "Job submitted and queued successfully",
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";

      this.logger.error(`Failed to submit job ${jobId}: ${message}`);

      await this.jobModel.updateOne(
        { job_id: jobId },
        {
          status: JobStatus.FAILED,
          $push: { logs: `Job ${jobId} failed to queue: ${message}` },
        },
      );

      throw error;
    }
  }

  async getJobStatus(jobId: string) {
    this.logger.log(`Fetching job status for ID: ${jobId}`);
    const job = await this.jobModel.findOne({ job_id: jobId }).exec();

    if (!job) {
      this.logger.warn(`Job ${jobId} not found`);
      throw new Error(`Job ${jobId} not found`);
    }

    return {
      job_id: job.job_id,
      org_id: job.org_id,
      priority: job.priority,
      app_version_id: job.app_version_id,
      test_path: job.test_path,
      target: job.target,
      status: job.status,
      created_at: job.createdAt?.toISOString(),
      updated_at: job.updatedAt?.toISOString(),
      logs: job.logs,
    };
  }

  async getJobsByGroup(appVersionId: string, limit = 10, offset = 0) {
    this.logger.log(`Fetching jobs for appVersionId: ${appVersionId}`);
    const jobs = await this.jobModel
      .find({ app_version_id: appVersionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    const total = await this.jobModel.countDocuments({
      app_version_id: appVersionId,
    });

    this.logger.log(`Found ${jobs.length} jobs (total: ${total})`);

    return {
      jobs: jobs.map((job) => ({
        job_id: job.job_id,
        org_id: job.org_id,
        status: job.status,
        app_version_id: job.app_version_id,
        test_path: job.test_path,
        target: job.target,
        priority: job.priority,
        created_at: job.createdAt?.toISOString(),
        updated_at: job.updatedAt?.toISOString(),
        logs: job.logs,
      })),
      total,
    };
  }

  async getJobStats() {
    this.logger.log("Calculating job statistics");

    const statusCounts = await this.jobModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const totalJobs = await this.jobModel.countDocuments();
    const environmentStats = await this.jobModel.aggregate([
      { $group: { _id: "$target_environment", count: { $sum: 1 } } },
    ]);

    this.logger.log("Job statistics calculated");

    return {
      total_jobs: totalJobs,
      status_breakdown: statusCounts.reduce<Record<string, number>>(
        (acc, item: { _id: string; count: number }) => {
          acc[item._id] = item.count;
          return acc;
        },
        {},
      ),
      environment_breakdown: environmentStats.reduce<Record<string, number>>(
        (acc, item: { _id: string; count: number }) => {
          acc[item._id] = item.count;
          return acc;
        },
        {},
      ),
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDuplicateJob(
    submitJobDto: SubmitJobDto,
  ): Promise<JobDocument | null> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.logger.log("Checking for duplicate job submission");

    return this.jobModel
      .findOne({
        org_id: submitJobDto.org_id,
        app_version_id: submitJobDto.app_version_id,
        test_path: submitJobDto.test_path,
        target: submitJobDto.target,
        status: {
          $in: [JobStatus.PENDING, JobStatus.QUEUED, JobStatus.RUNNING],
        },
        createdAt: { $gte: oneHourAgo },
      })
      .exec();
  }
}
