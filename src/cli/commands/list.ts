import { Command } from "commander";
import { loadJobHistory } from "../utils/config";
import { logger } from "../utils/logger";

export function registerListCommand(program: Command) {
  program
    .command("list")
    .description("Show recent job history")
    .action(() => {
      const history = loadJobHistory();

      if (!history.length) {
        logger.info("No recent jobs found.");
        return;
      }

      logger.info("Recent jobs:");
      history.forEach((jobId, index) => {
        logger.info(`${index + 1}. ${jobId}`);
      });
    });
}
