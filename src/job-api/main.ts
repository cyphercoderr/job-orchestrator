import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { JobApiModule } from "./job-api.module";

async function bootstrap() {
  const app = await NestFactory.create(JobApiModule);
  const logger = new Logger("Bootstrap");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("Test Orchestration Platform API")
    .setDescription("REST API for test job submission and management")
    .setVersion("1.0")
    .addTag("jobs")
    .addTag("health")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.JOB_API_PORT || 3001;
  await app.listen(port);

  logger.log(`Job API running on http://localhost:${port}`);
  logger.log(`API Documentation available at http://localhost:${port}/docs`);
}

bootstrap();
