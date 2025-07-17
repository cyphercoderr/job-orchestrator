import { Command } from "commander";
import { loadJobConfig } from "../utils/config";
import { logger } from "../utils/logger";

export function registerConfigCommand(program: Command) {
  program
    .command("config")
    .description("View current CLI config")
    .action(() => {
      const config = loadJobConfig();

      logger.info("Current config:\n");
      logger.info(JSON.stringify(config, null, 2));
    });
}
