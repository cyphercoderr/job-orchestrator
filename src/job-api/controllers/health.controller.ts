import { Controller, Get, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from "@nestjs/terminus";

@ApiTags("health")
@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
  ) {
    this.logger.log("HealthController initialized");
  }

  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @HealthCheck()
  check() {
    this.logger.log("Performing health check");

    return this.health
      .check([() => this.mongoose.pingCheck("mongodb")])
      .then((result) => {
        this.logger.log("Health check result: OK");
        return result;
      })
      .catch((error) => {
        this.logger.error("Health check failed", error);
        throw error;
      });
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness check endpoint" })
  readiness() {
    const message = "Readiness check passed";
    this.logger.log(message);

    return {
      status: "ready",
      timestamp: new Date().toISOString(),
      service: "job-api",
    };
  }
}
