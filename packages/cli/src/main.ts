#!/usr/bin/env bun
import { TimeSheet, type TimeWindow } from "@git-timesheet/core";
import { MarkdownReporter } from "@git-timesheet/reporter-markdown";
import { GitVcsProvider } from "@git-timesheet/vcs-git";
import { Command } from "commander";

const program = new Command();

program
    .name("git-timesheet")
    .description("Generate timesheet reports from git history")
    .version("0.1.0");

program
    .option("-s, --start-date <date>", "Start date (YYYY-MM-DD)")
    .option("-e, --end-date <date>", "End date (YYYY-MM-DD)")
    .option("-w, --window <window>", "Time window (e.g., 1d, 1w, 1m, 1y)")
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
                throw new Error(
                    "Please provide either --window or both --start-date and --end-date",
                );
            }

            console.log(report);
        } catch (error) {
            console.error("Error:", error.message);
            process.exit(1);
        }
    });

program.parse();
