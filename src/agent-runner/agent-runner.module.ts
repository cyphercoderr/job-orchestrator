import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bull";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { AgentRunnerService } from "./services/agent-runner.service";
import { JobProcessor } from "./processors/job.processor";
import { Job, JobSchema } from "../shared/schemas/job.schema";
import { QUEUE_NAMES } from "../shared/constants/job-status";
import databaseConfig from "../shared/config/database.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri:
          process.env.MONGODB_URI ||
          "mongodb://localhost:27017/test-orchestration",
      }),
    }),
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.JOB_PROCESSING },
      { name: QUEUE_NAMES.JOB_RETRY },
      { name: QUEUE_NAMES.JOB_CLEANUP },
    ),
    ClientsModule.register([
      {
        name: "JOB_SCHEDULER_SERVICE",
        transport: Transport.GRPC,
        options: {
          package: "job",
          protoPath: "./proto/job.proto",
          url: process.env.JOB_SCHEDULER_URL || "localhost:50051",
        },
      },
    ]),
  ],
  providers: [AgentRunnerService, JobProcessor],
})
export class AgentRunnerModule {}
