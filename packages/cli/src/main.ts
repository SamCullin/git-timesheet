#!/usr/bin/env bun
import { ConfigManager, configSchema } from "@git-timesheet/config";
import { ZodConf } from "@git-timesheet/config";
import { TimeSheet, type TimeWindow } from "@git-timesheet/core";
import { MarkdownReporter } from "@git-timesheet/reporter-markdown";
import { GitVcsProvider } from "@git-timesheet/vcs-git";
import { Command } from "commander";

export function createProgram(configManager: ConfigManager): Command {
    const program = new Command();
    const config = configManager;

    program
        .name("git-timesheet")
        .description("Generate timesheet reports from git history")
        .version("0.1.0");

    // Config commands
    const configCommand = program.command("config").description("Manage configuration");

    configCommand
        .command("set")
        .description("Set configuration values")
        .option("-f, --format <format>", "Default output format (markdown, json, html)")
        .option("-w, --window <window>", "Default time window (e.g., 1d, 1w, 1m, 1y)")
        .option("--work-start <time>", "Work day start time (HH:MM)")
        .option("--work-end <time>", "Work day end time (HH:MM)")
        .option("--work-weekends <true|false>", "Include weekends in calculations")
        .action((options) => {
            console.log("Set command executed with options:", options);
            try {
                if (options.format) {
                    console.log("Setting format to:", options.format);
                    const validFormats = ["markdown", "json", "html"];
                    if (!validFormats.includes(options.format)) {
                        throw new Error(
                            `Invalid format. Must be one of: ${validFormats.join(", ")}`,
                        );
                    }
                    config.setDefaultFormat(options.format);
                    const newFormat = config.config.defaultFormat;
                    console.log("Format set, current value:", newFormat);
                }

                if (options.window) {
                    const match = options.window.match(/^(\d+)([dwmy])$/);
                    if (!match) {
                        throw new Error("Invalid window format. Use format like 1d, 1w, 1m, 1y");
                    }

                    const [, value, unit] = match;
                    const numValue = Number.parseInt(value, 10);
                    if (numValue <= 0) {
                        throw new Error("Window value must be positive");
                    }

                    const timeWindow = {
                        value: numValue,
                        unit:
                            unit === "d"
                                ? "day"
                                : unit === "w"
                                  ? "week"
                                  : unit === "m"
                                      ? "month"
                                      : "year",
                    } as const;
                    config.setDefaultTimeWindow(timeWindow.unit, timeWindow.value);
                    console.log(`Default time window set to: ${value}${unit}`);
                }

                if (options.workStart || options.workEnd || options.workWeekends !== undefined) {
                    const workingHours = config.config.workingHours;
                    const start = options.workStart || workingHours.start;
                    const end = options.workEnd || workingHours.end;
                    const excludeWeekends =
                        options.workWeekends === "true"
                            ? false
                            : options.workWeekends === "false"
                              ? true
                              : workingHours.excludeWeekends;

                    // Validate time format before setting
                    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
                    if (options.workStart && !timeRegex.test(start)) {
                        throw new Error(
                            "Invalid time format for work-start. Use HH:MM (24-hour format)",
                        );
                    }
                    if (options.workEnd && !timeRegex.test(end)) {
                        throw new Error(
                            "Invalid time format for work-end. Use HH:MM (24-hour format)",
                        );
                    }

                    config.setWorkingHours(start, end, excludeWeekends);
                    console.log("Working hours updated");
                }
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    program
        .command("config repo add")
        .description("Add a repository")
        .argument("<path>", "Path to the repository")
        .option("-n, --name <name>", "Repository name")
        .option("-b, --branch <branch>", "Default branch")
        .action((path, options) => {
            try {
                config.addRepository(path, options.name, options.branch);
                console.log(`Repository added: ${path}`);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    program
        .command("config repo remove")
        .description("Remove a repository")
        .argument("<path>", "Path to the repository")
        .action((path) => {
            try {
                config.removeRepository(path);
                console.log(`Repository removed: ${path}`);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    program
        .command("config repo list")
        .description("List configured repositories")
        .action(() => {
            const repos = config.config.repositories;
            if (repos.length === 0) {
                console.log("No repositories configured");
                return;
            }
            console.log("Configured repositories:");
            for (const repo of repos) {
                console.log(
                    `- ${repo.path}${repo.name ? ` (${repo.name})` : ""}${
                        repo.branch ? ` [${repo.branch}]` : ""
                    }`,
                );
            }
        });

    program
        .command("config author include")
        .description("Add author to include list")
        .argument("<author>", "Author name or email")
        .action((author) => {
            try {
                config.addAuthor(author, false);
                console.log(`Author added to include list: ${author}`);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    program
        .command("config author exclude")
        .description("Add author to exclude list")
        .argument("<author>", "Author name or email")
        .action((author) => {
            try {
                config.addAuthor(author, true);
                console.log(`Author added to exclude list: ${author}`);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    program
        .command("config author list")
        .description("List author filters")
        .action(() => {
            const authors = config.config.authors;
            if (authors.include.length === 0 && authors.exclude.length === 0) {
                console.log("No author filters configured");
                return;
            }
            if (authors.include.length > 0) {
                console.log("Included authors:");
                for (const author of authors.include) {
                    console.log(`- ${author}`);
                }
            }
            if (authors.exclude.length > 0) {
                console.log("Excluded authors:");
                for (const author of authors.exclude) {
                    console.log(`- ${author}`);
                }
            }
        });

    program
        .command("config show")
        .description("Show current configuration")
        .action(() => {
            const conf = config.config;
            console.log(JSON.stringify(conf, null, 2));
        });

    // Report generation command
    program
        .option("-s, --start-date <date>", "Start date (YYYY-MM-DD)")
        .option("-e, --end-date <date>", "End date (YYYY-MM-DD)")
        .option("-w, --window <window>", "Time window (e.g., 1d, 1w, 1m, 1y)")
        .option("-f, --format <format>", "Output format (markdown, json, html)")
        .option("-r, --repo <path>", "Repository path (defaults to current directory)")
        .action(async (options) => {
            try {
                const vcsProvider = new GitVcsProvider();
                const reporter = new MarkdownReporter();
                const timesheet = new TimeSheet(vcsProvider, reporter);

                let report: string;

                if (options.window) {
                    const match = options.window.match(/^(\d+)([dwmy])$/);
                    if (!match) {
                        throw new Error("Invalid window format. Use format like 1d, 1w, 1m, 1y");
                    }

                    const [, value, unit] = match;
                    const window: TimeWindow = {
                        value: Number.parseInt(value, 10),
                        unit:
                            unit === "d"
                                ? "day"
                                : unit === "w"
                                  ? "week"
                                  : unit === "m"
                                      ? "month"
                                      : "year",
                    };

                    report = await timesheet.generateReportByWindow(window);
                } else if (options.startDate && options.endDate) {
                    const startDate = new Date(options.startDate);
                    const endDate = new Date(options.endDate);

                    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
                        throw new Error("Invalid date format. Use YYYY-MM-DD");
                    }

                    report = await timesheet.generateReport({ startDate, endDate });
                } else {
                    // Use default time window from config
                    const defaultWindow = config.config.defaultTimeWindow;
                    report = await timesheet.generateReportByWindow(defaultWindow);
                }

                console.log(report);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                process.exit(1);
            }
        });

    return program;
}

// Create and run the program if this is the main module
if (import.meta.main) {
    const config = new ConfigManager(new ZodConf(configSchema));
    const program = createProgram(config);
    program.parse();
}
