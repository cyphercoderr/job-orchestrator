import { Injectable, Logger } from "@nestjs/common";
import type { Model } from "mongoose";
import { Job, type JobDocument } from "../../shared/schemas/job.schema";
import { JobStatus } from "../../shared/constants/job-status";
import {
  GetJobsByGroupResponse,
  GetJobStatusResponse,
  SubmitJobRequest,
  SubmitJobResponse,
} from "src/proto/job";
import { InjectModel } from "@nestjs/mongoose";
import { QueueService } from "./queue.service";

@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);

  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private queueService: QueueService,
  ) {
    this.logger.log("JobSchedulerService initialized");
  }

  async submitJob(data: SubmitJobRequest): Promise<SubmitJobResponse> {
    this.logger.log(`Submitting job: ${data.jobId}`);
    this.logger.debug(`SubmitJobRequest payload: ${JSON.stringify(data)}`);

    try {
      const groupedJobs = await this.getJobGroup(data.appVersionId);
      this.logger.log(
        `Found ${groupedJobs.length} related jobs for grouping with jobId: ${data.jobId}`,
      );

      await this.queueService.addJobToQueue({
        job_id: data.jobId,
        org_id: data.orgId,
        app_version_id: data.appVersionId,
        test_path: data.testPath,
        target: data.target,
        priority: data.priority || 5,
        group_size: groupedJobs.length + 1,
        group_jobs: groupedJobs.map((job) => job.job_id),
      });

      await this.jobModel.updateOne(
        { job_id: data.jobId },
        {
          status: JobStatus.QUEUED,
          $push: {
            logs: `Job ${data.jobId} added to queue with priority ${data.priority || 5}`,
          },
        },
      );

      this.logger.log(`Job ${data.jobId} queued successfully`);

      return {
        jobId: data.jobId,
        status: JobStatus.QUEUED,
        message: "Job successfully queued for processing",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to queue job ${data.jobId}: ${message}`, error);

      return {
        jobId: data.jobId,
        status: JobStatus.FAILED,
        message: `Failed to queue job: ${message}`,
      };
    }
  }

  async getJobStatus(jobId: string): Promise<GetJobStatusResponse> {
    this.logger.log(`Fetching job status for jobId: ${jobId}`);

    const job = await this.jobModel.findOne({ job_id: jobId }).exec();
    if (!job) {
      this.logger.warn(`Job ${jobId} not found`);
      throw new Error(`Job ${jobId} not found`);
    }

    this.logger.log(`Job ${jobId} status fetched successfully`);
    return {
      jobId: job.job_id,
      orgId: job.org_id,
      appVersionId: job.app_version_id,
      testPath: job.test_path,
      target: job.target,
      status: job.status,
      createdAt: job.createdAt?.toISOString() ?? "",
      updatedAt: job.updatedAt?.toISOString() ?? "",
      logs: job.logs,
    };
  }

  async getJobsByGroup(
    appVersionId: string,
    limit: number,
    offset: number,
  ): Promise<GetJobsByGroupResponse> {
    this.logger.log(
      `Fetching jobs by appVersionId: ${appVersionId}, limit: ${limit}, offset: ${offset}`,
    );

    const jobs = await this.jobModel
      .find({ app_version_id: appVersionId })
      .sort({ priority: -1, createdAt: 1 })
      .limit(limit)
      .skip(offset)
      .exec();

    const total = await this.jobModel.countDocuments({
      app_version_id: appVersionId,
    });

    this.logger.log(
      `Fetched ${jobs.length} jobs (total: ${total}) for appVersionId: ${appVersionId}`,
    );

    const mappedJobs: GetJobStatusResponse[] = jobs.map((job) => ({
      jobId: job.job_id,
      orgId: job.org_id,
      appVersionId: job.app_version_id,
      testPath: job.test_path,
      target: job.target,
      status: job.status,
      createdAt: job.createdAt?.toISOString() ?? "",
      updatedAt: job.updatedAt?.toISOString() ?? "",
      logs: job.logs,
    }));

    return {
      jobs: mappedJobs,
      total,
    };
  }

  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    logs: string[] = [],
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Updating job status: jobId=${jobId}, status=${status}, logs=${logs.length}`,
    );

    try {
      const updateData: Record<string, unknown> = {
        status,
        $push: { logs: { $each: logs } },
        $set: {
          updatedAt: new Date(),
        },
      };

      if (status === JobStatus.RUNNING) {
        (updateData.$set as Record<string, unknown>).createdAt = new Date();
      } else if (
        status === JobStatus.COMPLETED ||
        status === JobStatus.FAILED
      ) {
        (updateData.$set as Record<string, unknown>).updatedAt = new Date();
      }

      await this.jobModel.updateOne({ job_id: jobId }, updateData);

      this.logger.log(`Job ${jobId} status updated to ${status}`);

      return {
        success: true,
        message: `Job ${jobId} status updated to ${status}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to update job ${jobId}: ${message}`, error);

      return {
        success: false,
        message: `Failed to update job ${jobId}: ${message}`,
      };
    }
  }

  private async getJobGroup(appVersionId: string): Promise<JobDocument[]> {
    this.logger.log(`Fetching job group for appVersionId: ${appVersionId}`);

    const jobs = await this.jobModel
      .find({
        app_version_id: appVersionId,
        status: {
          $in: [JobStatus.PENDING, JobStatus.QUEUED, JobStatus.RUNNING],
        },
      })
      .sort({ priority: -1, createdAt: 1 })
      .exec();

    this.logger.log(
      `Found ${jobs.length} active jobs for appVersionId: ${appVersionId}`,
    );

    return jobs;
  }
}
