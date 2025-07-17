import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import {
  SubmitJobRequest,
  SubmitJobResponse,
  GetJobStatusRequest,
  GetJobStatusResponse,
  GetJobsByGroupRequest,
  GetJobsByGroupResponse,
  UpdateJobStatusRequest,
  UpdateJobStatusResponse,
} from "../../proto/job";
import { JobStatus } from "src/shared/constants/job-status";
import { JobSchedulerService } from "../services/job-scheduler.service";

@Controller()
export class JobSchedulerController {
  private readonly logger = new Logger(JobSchedulerController.name);

  constructor(private readonly jobSchedulerService: JobSchedulerService) {
    this.logger.log("JobSchedulerController initialized");
  }

  @GrpcMethod("JobSchedulerService", "SubmitJob")
  async submitJob(data: SubmitJobRequest): Promise<SubmitJobResponse> {
    this.logger.log(`Received SubmitJob request for jobId: ${data.jobId}`);
    this.logger.debug(`SubmitJob payload: ${JSON.stringify(data)}`);

    try {
      const response = await this.jobSchedulerService.submitJob(data);
      this.logger.log(`SubmitJob processed for jobId: ${data.jobId}`);
      return response;
    } catch (error) {
      this.logger.error(`SubmitJob failed for jobId: ${data.jobId}`, error);
      throw error;
    }
  }

  @GrpcMethod("JobSchedulerService", "GetJobStatus")
  async getJobStatus(data: GetJobStatusRequest): Promise<GetJobStatusResponse> {
    this.logger.log(`Received GetJobStatus request for jobId: ${data.jobId}`);

    try {
      const response = await this.jobSchedulerService.getJobStatus(data.jobId);
      this.logger.log(
        `GetJobStatus response returned for jobId: ${data.jobId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`GetJobStatus failed for jobId: ${data.jobId}`, error);
      throw error;
    }
  }

  @GrpcMethod("JobSchedulerService", "GetJobsByGroup")
  async getJobsByGroup(
    data: GetJobsByGroupRequest,
  ): Promise<GetJobsByGroupResponse> {
    this.logger.log(
      `Received GetJobsByGroup request for appVersionId: ${data.appVersionId}, limit: ${data.limit}, offset: ${data.offset}`,
    );

    try {
      const response = await this.jobSchedulerService.getJobsByGroup(
        data.appVersionId,
        data.limit ?? 10,
        data.offset ?? 0,
      );
      this.logger.log(
        `GetJobsByGroup processed for appVersionId: ${data.appVersionId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `GetJobsByGroup failed for appVersionId: ${data.appVersionId}`,
        error,
      );
      throw error;
    }
  }

  @GrpcMethod("JobSchedulerService", "UpdateJobStatus")
  async updateJobStatus(
    data: UpdateJobStatusRequest,
  ): Promise<UpdateJobStatusResponse> {
    this.logger.log(`Received UpdateJobStatus for jobId: ${data.jobId}`);
    this.logger.debug(`UpdateJobStatus payload: ${JSON.stringify(data)}`);

    try {
      const response = await this.jobSchedulerService.updateJobStatus(
        data.jobId,
        data.status as JobStatus,
        data.logs,
      );
      this.logger.log(`Job status updated for jobId: ${data.jobId}`);
      return response;
    } catch (error) {
      this.logger.error(
        `UpdateJobStatus failed for jobId: ${data.jobId}`,
        error,
      );
      throw error;
    }
  }
}
