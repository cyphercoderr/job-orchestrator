import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { type MicroserviceOptions, Transport } from "@nestjs/microservices";
import { JobSchedulerModule } from "./job-scheduler.module";

async function bootstrap() {
  const logger = new Logger("JobSchedulerBootstrap");

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    JobSchedulerModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "job",
        protoPath: "./proto/job.proto",
        url: process.env.JOB_SCHEDULER_URL || "localhost:50051",
      },
    },
  );

  app
    .listen()
    .then(() => {
      logger.log("Job Scheduler microservice is running on port 50051");
    })
    .catch((err) => {
      logger.error("Failed to start Job Scheduler microservice", err);
    });
}

bootstrap();
