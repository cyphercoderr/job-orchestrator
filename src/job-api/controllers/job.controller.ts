import {
  Controller,
  Post,
  Get,
  Query,
  Param,
  HttpStatus,
  HttpException,
  Body,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { JobService } from "../services/job.service";
import { JobStatusDto, SubmitJobDto } from "../../shared/dto/job.dto";

@ApiTags("jobs")
@Controller("jobs")
export class JobController {
  private readonly logger = new Logger(JobController.name);

  constructor(private readonly jobService: JobService) {
    this.logger.log("JobController initialized");
  }

  @Post("submit")
  @ApiOperation({ summary: "Submit a new test job" })
  @ApiResponse({ status: 201, description: "Job submitted successfully" })
  @ApiResponse({ status: 400, description: "Invalid job data" })
  async submitJob(@Body() submitJobDto: SubmitJobDto) {
    this.logger.log("Received job submission request");

    try {
      this.logger.debug(`submitJobDto: ${JSON.stringify(submitJobDto)}`);
      const result = await this.jobService.submitJob(submitJobDto);
      return {
        success: true,
        data: result,
        message: "Job submitted successfully",
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      this.logger.error(`Error in submitJob: ${message}`);

      throw new HttpException(
        { success: false, message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get("status")
  @ApiOperation({ summary: "Get job status by ID" })
  @ApiQuery({ name: "jobId", description: "Job identifier" })
  @ApiResponse({
    status: 200,
    description: "Job status retrieved",
    type: JobStatusDto,
  })
  @ApiResponse({ status: 404, description: "Job not found" })
  async getJobStatus(@Query("jobId") jobId: string) {
    if (!jobId) {
      this.logger.warn("Missing jobId parameter in getJobStatus");
      throw new HttpException(
        { success: false, message: "jobId parameter is required" },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.log(`Fetching status for job: ${jobId}`);
      const job = await this.jobService.getJobStatus(jobId);

      return {
        success: true,
        data: job,
        message: "Job status retrieved successfully",
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      this.logger.error(`Error in getJobStatus for ${jobId}: ${message}`);

      throw new HttpException(
        { success: false, message },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get("group/:appVersionId")
  @ApiOperation({ summary: "Get jobs by app version ID" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of jobs to return",
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Number of jobs to skip",
  })
  async getJobsByGroup(
    @Param("appVersionId") appVersionId: string,
    @Query("limit") limit: string = "10",
    @Query("offset") offset: string = "0",
  ) {
    try {
      this.logger.log(
        `Fetching jobs for appVersionId=${appVersionId}, limit=${limit}, offset=${offset}`,
      );

      const jobs = await this.jobService.getJobsByGroup(
        appVersionId,
        Number.parseInt(limit, 10),
        Number.parseInt(offset, 10),
      );

      return {
        success: true,
        data: jobs,
        message: "Jobs retrieved successfully",
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      this.logger.error(
        `Error in getJobsByGroup for appVersionId=${appVersionId}: ${message}`,
      );

      throw new HttpException(
        { success: false, message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("stats")
  @ApiOperation({ summary: "Get job statistics" })
  async getJobStats() {
    try {
      this.logger.log("Fetching job statistics");
      const stats = await this.jobService.getJobStats();

      return {
        success: true,
        data: stats,
        message: "Job statistics retrieved successfully",
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      this.logger.error(`Error in getJobStats: ${message}`);

      throw new HttpException(
        { success: false, message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
