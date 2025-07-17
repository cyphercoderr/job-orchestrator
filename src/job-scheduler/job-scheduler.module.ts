import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { BullModule } from "@nestjs/bull";
import { JobSchedulerController } from "./controllers/job-scheduler.controller";
import { JobSchedulerService } from "./services/job-scheduler.service";
import { Job, JobSchema } from "../shared/schemas/job.schema";
import { QUEUE_NAMES } from "../shared/constants/job-status";
import databaseConfig from "../shared/config/database.config";
import { QueueService } from "./services/queue.service";

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
          port: Number.parseInt(process.env.REDIS_PORT ?? "6379", 10),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.JOB_PROCESSING },
      { name: QUEUE_NAMES.JOB_RETRY },
      { name: QUEUE_NAMES.JOB_CLEANUP },
    ),
  ],
  controllers: [JobSchedulerController],
  providers: [JobSchedulerService, QueueService],
})
export class JobSchedulerModule {}
