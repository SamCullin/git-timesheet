import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { ConfigManager } from "@git-timesheet/config";
import type { Command } from "commander";
import { createProgram } from "./main";

describe("CLI", () => {
    let config: ConfigManager;
    let program: Command;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ConfigManager } = require("@git-timesheet/config");
        config = new ConfigManager("git-timesheet-test");
        config.reset();
        program = createProgram(config);

        // Override exit behavior for testing
        program.exitOverride();
        for (const command of program.commands) {
            command.exitOverride();
            for (const subcommand of command.commands) {
                subcommand.exitOverride();
            }
        }
    });

    afterEach(() => {
        config.reset();
    });

    describe("config commands", () => {
        describe("set", () => {
            it("should set default format", async () => {
                console.log("Initial format:", config.get("defaultFormat"));
                await program.parseAsync(["node", "test", "config", "set", "-f", "json"]);
                const format = config.get("defaultFormat");
                console.log("Final format:", format);
                expect(format).toBe("json");
            });

            it("should validate format value", async () => {
                let error: Error | undefined;
                try {
                    await program.parseAsync(["node", "test", "config", "set", "-f", "invalid"]);
                } catch (e: unknown) {
                    error = e as Error;
                }
                expect(error).toBeDefined();
                expect(error?.message).toContain("Invalid format");
            });

            it("should set default time window", async () => {
                await program.parseAsync(["node", "test", "config", "set", "-w", "2w"]);
                const window = config.get("defaultTimeWindow");
                expect(window).toEqual({ unit: "week", value: 2 });
            });

            it("should validate time window format", async () => {
                let error: Error | undefined;
                try {
                    await program.parseAsync(["node", "test", "config", "set", "-w", "invalid"]);
                } catch (e: unknown) {
                    error = e as Error;
                }
                expect(error).toBeDefined();
                expect(error?.message).toContain("Invalid window format");
            });

            it("should validate time window value", async () => {
                let error: Error | undefined;
                try {
                    await program.parseAsync(["node", "test", "config", "set", "-w", "0w"]);
                } catch (e: unknown) {
                    error = e as Error;
                }
                expect(error).toBeDefined();
                expect(error?.message).toContain("Window value must be positive");
            });

            it("should set working hours", async () => {
                await program.parseAsync([
                    "node",
                    "test",
                    "config",
                    "set",
                    "--work-start",
                    "10:00",
                    "--work-end",
                    "18:00",
                    "--work-weekends",
                    "true",
                ]);
                const hours = config.get("workingHours");
                expect(hours).toEqual({
                    start: "10:00",
                    end: "18:00",
                    excludeWeekends: false,
                });
            });

            it("should validate working hours format", async () => {
                let error: Error | undefined;
                try {
                    await program.parseAsync([
                        "node",
                        "test",
                        "config",
                        "set",
                        "--work-start",
                        "25:00",
                    ]);
                } catch (e: unknown) {
                    error = e as Error;
                }
                expect(error).toBeDefined();
                expect(error?.message).toContain("Invalid time format");
            });
        });

        describe("repo", () => {
            it("should add repository", async () => {
                await program.parseAsync([
                    "node",
                    "test",
                    "config",
                    "repo",
                    "add",
                    "/test/repo",
                    "-n",
                    "Test Repo",
                    "-b",
                    "main",
                ]);
                const repos = config.get("repositories");
                expect(repos).toEqual([{ path: "/test/repo", name: "Test Repo", branch: "main" }]);
            });

            it("should remove repository", async () => {
                config.addRepository("/test/repo");
                await program.parseAsync([
                    "node",
                    "test",
                    "config",
                    "repo",
                    "remove",
                    "/test/repo",
                ]);
                const repos = config.get("repositories");
                expect(repos).toEqual([]);
            });
        });

        describe("author", () => {
            it("should add included author", async () => {
                await program.parseAsync([
                    "node",
                    "test",
                    "config",
                    "author",
                    "include",
                    "John Doe",
                ]);
                const authors = config.get("authors");
                expect(authors.include).toEqual(["John Doe"]);
            });

            it("should add excluded author", async () => {
                await program.parseAsync([
                    "node",
                    "test",
                    "config",
                    "author",
                    "exclude",
                    "John Doe",
                ]);
                const authors = config.get("authors");
                expect(authors.exclude).toEqual(["John Doe"]);
            });
        });
    });
});
