import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TerminusModule } from "@nestjs/terminus";
import { JobController } from "./controllers/job.controller";
import { HealthController } from "./controllers/health.controller";
import { JobService } from "./services/job.service";
import { Job, JobSchema } from "../shared/schemas/job.schema";
import databaseConfig from "../shared/config/database.config";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
      }),
    }),
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
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
    TerminusModule,
    PrometheusModule.register(),
  ],
  controllers: [JobController, HealthController],
  providers: [JobService],
})
export class JobApiModule {}
