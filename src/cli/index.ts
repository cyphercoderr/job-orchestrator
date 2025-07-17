#!/usr/bin/env node

import { Command } from "commander";
import { registerSubmitCommand } from "./commands/submit";
import { registerStatusCommand } from "./commands/status";
import { registerPollCommand } from "./commands/poll";
import { registerListCommand } from "./commands/list";
import { registerConfigCommand } from "./commands/config";

const program = new Command();

program.name("qgjob").description("Test Orchestration CLI").version("1.0.0");

registerSubmitCommand(program);
registerStatusCommand(program);
registerPollCommand(program);
registerListCommand(program);
registerConfigCommand(program);

program.parse();
