import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common"; // <-- Import Logger
import { AgentRunnerModule } from "./agent-runner.module";

async function bootstrap() {
  const logger = new Logger("AgentRunnerBootstrap"); // <-- Create logger instance

  const app = await NestFactory.create(AgentRunnerModule);

  const port = process.env.AGENT_RUNNER_PORT || 3003;
  await app.listen(port);

  logger.log(`🤖 Agent Runner service is running on port ${port}`);
}

bootstrap();
