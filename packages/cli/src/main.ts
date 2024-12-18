#!/usr/bin/env bun
import { ConfigManager, configSchema } from "@git-timesheet/config";
import { ZodConf } from "@git-timesheet/config";
import { TimeSheet, parseWindow, windowToRange } from "@git-timesheet/core";
import { MarkdownReporter } from "@git-timesheet/reporter-markdown";
import { GitVcsProvider } from "@git-timesheet/vcs-git";
import { Command } from "commander";

export function createProgram(configManager: ConfigManager): Command {
    const program = new Command();
    const config = configManager;

    program
        .name("git-timesheet")
        .description("Generate timesheet reports from git history")
        .version("0.1.0")
        .option("-s, --start-date <date>", "Start date (YYYY-MM-DD)")
        .option("-e, --end-date <date>", "End date (YYYY-MM-DD)")
        .option("-w, --window <window>", "Time window (e.g., 1d, 1w, 1m, 1y)")
        .option("-f, --format <format>", "Output format (markdown, json, html)")
        .option("-r, --repo <path>", "Repository path (defaults to current directory)");

    const repo_cmd = program.command("repo");

    repo_cmd
        .command("add")
        .description("Add a repository")
        .argument("<label>", "Label for the repository")
        .argument("<path>", "Path to the repository")
        .action((label, path) => {
            try {
                config.addRepository(path, label);
                console.log(`Repository added: ${label} -> ${path}`);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    repo_cmd
        .command("remove")
        .description("Remove a repository")
        .argument("<label>", "Label of the repository")
        .action((label) => {
            try {
                config.removeRepository(label);
                console.log(`Repository removed: ${label}`);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    repo_cmd
        .command("list")
        .description("List configured repositories")
        .action(() => {
            const repos = config.config.repositories;
            if (repos.length === 0) {
                console.log("No repositories configured");
                return;
            }
            console.log("Configured repositories:");
            for (const repo of repos) {
                console.log(`${repo.name}: ${repo.path}`);
            }
        });

    const author_cmd = program.command("author");

    author_cmd
        .command("add")
        .description("Add an author")
        .argument("<author>", "Author name or email")
        .action((author) => {
            try {
                config.addAuthor(author, false);
                console.log(`Author added: ${author}`);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    author_cmd
        .command("remove")
        .description("Remove an author")
        .argument("<author>", "Author name or email")
        .action((author) => {
            try {
                config.removeAuthor(author);
                console.log(`Author removed: ${author}`);
            } catch (error: unknown) {
                console.error("Error:", (error as Error).message);
                throw error;
            }
        });

    author_cmd
        .command("list")
        .description("List authors")
        .action(() => {
            const authors = config.config.authors;
            if (authors.include.length === 0 && authors.exclude.length === 0) {
                console.log("No authors configured");
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
        .command("show")
        .description("Show current configuration")
        .action(() => {
            const conf = config.config;
            console.log(JSON.stringify(conf, null, 2));
        });

    // Default command for report generation
    program.action(async (options) => {
        try {
            const vcsProvider = new GitVcsProvider();
            const reporter = new MarkdownReporter();
            const timesheet = new TimeSheet(vcsProvider, reporter);

            let report: string;

            if (options.window) {
                const parsedWindow = parseWindow(options.window);
                const timeRange = windowToRange(parsedWindow);
                report = await timesheet.generateReport({
                    timeRange,
                    repositories: config.config.repositories.map((repo) => repo.path),
                });
            } else if (options.startDate && options.endDate) {
                const startDate = new Date(options.startDate);
                const endDate = new Date(options.endDate);

                if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
                    throw new Error("Invalid date format. Use YYYY-MM-DD");
                }

                report = await timesheet.generateReport({
                    timeRange: { startDate, endDate },
                    repositories: config.config.repositories.map((repo) => repo.path),
                });
            } else {
                // Use default time window from config
                const defaultWindow = config.config.defaultTimeWindow;
                const timeRange = windowToRange(defaultWindow);
                report = await timesheet.generateReport({
                    timeRange,
                    repositories: config.config.repositories.map((repo) => repo.path),
                });
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
