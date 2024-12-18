import { describe, expect, it } from "bun:test";
import type { LogInfo } from "@git-timesheet/vcs";
import { MarkdownReporter } from "./index";

describe("MarkdownReporter", () => {
    const reporter = new MarkdownReporter();

    describe("generateReport", () => {
        it("should handle empty commits list", async () => {
            const result = await reporter.generateReport([]);
            expect(result).toBeTruthy();
            expect(result).toBeTypeOf("string");
            expect(result.length).toBeGreaterThan(0);
        });

        it("should include commit metadata in report", async () => {
            const commits: LogInfo[] = [
                {
                    datetime: new Date("2024-01-10T09:00:00Z"),
                    repository: "/test/repo",
                    targetDirectory: "src",
                    branch: "main",
                    message: "Test commit",
                    hash: "abc123",
                },
            ];

            const result = await reporter.generateReport(commits);

            expect(result).toContain("main");
            expect(result).toContain("Test commit");
            expect(result).toContain("abc123");
        });

        it("should include date in report", async () => {
            const commits: LogInfo[] = [
                {
                    datetime: new Date("2024-01-10T09:00:00Z"),
                    repository: "/test/repo",
                    targetDirectory: "src",
                    branch: "main",
                    message: "Day 1 commit",
                    hash: "abc123",
                },
                {
                    datetime: new Date("2024-01-11T10:00:00Z"),
                    repository: "/test/repo",
                    targetDirectory: "src",
                    branch: "main",
                    message: "Day 2 commit",
                    hash: "def456",
                },
            ];

            const result = await reporter.generateReport(commits);

            expect(result).toContain("2024-01-10");
            expect(result).toContain("2024-01-11");
        });

        it("should include repository and directory information", async () => {
            const commits: LogInfo[] = [
                {
                    datetime: new Date(),
                    repository: "/repo1",
                    targetDirectory: "src",
                    branch: "main",
                    message: "Commit 1",
                    hash: "abc123",
                },
                {
                    datetime: new Date(),
                    repository: "/repo2",
                    targetDirectory: "tests",
                    branch: "main",
                    message: "Commit 2",
                    hash: "def456",
                },
            ];

            const result = await reporter.generateReport(commits);

            expect(result).toContain("repo1");
            expect(result).toContain("repo2");
        });

        it("should include branch information", async () => {
            const commits: LogInfo[] = [
                {
                    datetime: new Date(),
                    repository: "/test",
                    targetDirectory: "src",
                    branch: "main",
                    message: "Main branch commit",
                    hash: "abc123",
                },
                {
                    datetime: new Date(),
                    repository: "/test",
                    targetDirectory: "src",
                    branch: "feature",
                    message: "Feature branch commit",
                    hash: "def456",
                },
            ];

            const result = await reporter.generateReport(commits);

            expect(result).toContain("main");
            expect(result).toContain("feature");
        });
    });
});
