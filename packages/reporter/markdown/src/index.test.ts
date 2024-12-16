import { describe, expect, it } from "bun:test";
import type { DailyStats } from "@git-timesheet/core";
import { MarkdownReporter } from "./index";

describe("MarkdownReporter", () => {
	const reporter = new MarkdownReporter();

	describe("generateReport", () => {
		it("should handle empty stats", async () => {
			const result = await reporter.generateReport([]);
			expect(result).toContain("No commits found");
		});

		it("should generate a report with single day stats", async () => {
			const date = new Date("2024-01-10T10:00:00Z");
			const stats: DailyStats[] = [
				{
					date,
					firstCommitTime: new Date("2024-01-10T09:00:00Z"),
					lastCommitTime: new Date("2024-01-10T17:30:00Z"),
					totalTimeSpent: 510, // 8.5 hours in minutes
					commits: [
						{
							datetime: new Date("2024-01-10T09:00:00Z"),
							repository: "/home/user/projects/test",
							targetDirectory: "src",
							branch: "main",
							message: "Initial commit",
							hash: "abc1234def5678",
						},
					],
				},
			];

			const result = await reporter.generateReport(stats);

			// Check summary section
			expect(result).toContain("# Git TimeSheet Report");
			expect(result).toContain("Total Days: 1");
			expect(result).toContain("Total Commits: 1");
			expect(result).toContain("8 hours 30 minutes");

			// Check daily breakdown
			expect(result).toContain("### 2024-01-10");
			expect(result).toMatch(/First Commit: 9:00:00 AM/);
			expect(result).toMatch(/Last Commit: 5:30:00 PM/);
			expect(result).toContain("**Repository:** /home/user/projects/test");
			expect(result).toContain("**Directory:** src");
			expect(result).toContain("`abc1234` ");
			expect(result).toContain("[main] Initial commit");
		});

		it("should generate a report with multiple days and commits", async () => {
			const stats: DailyStats[] = [
				{
					date: new Date("2024-01-10"),
					firstCommitTime: new Date("2024-01-10T09:00:00Z"),
					lastCommitTime: new Date("2024-01-10T17:00:00Z"),
					totalTimeSpent: 480,
					commits: [
						{
							datetime: new Date("2024-01-10T09:00:00Z"),
							repository: "/repo1",
							targetDirectory: "src",
							branch: "main",
							message: "First commit",
							hash: "abc1234",
						},
						{
							datetime: new Date("2024-01-10T17:00:00Z"),
							repository: "/repo1",
							targetDirectory: "tests",
							branch: "feature",
							message: "Add tests",
							hash: "def5678",
						},
					],
				},
				{
					date: new Date("2024-01-11"),
					firstCommitTime: new Date("2024-01-11T10:00:00Z"),
					lastCommitTime: new Date("2024-01-11T16:00:00Z"),
					totalTimeSpent: 360,
					commits: [
						{
							datetime: new Date("2024-01-11T10:00:00Z"),
							repository: "/repo2",
							targetDirectory: "",
							branch: "main",
							message: "Root commit",
							hash: "ghi9012",
						},
					],
				},
			];

			const result = await reporter.generateReport(stats);

			// Check summary
			expect(result).toContain("Total Days: 2");
			expect(result).toContain("Total Commits: 3");
			expect(result).toContain("14 hours");

			// Check repositories and directories
			expect(result).toContain("**Repository:** /repo1");
			expect(result).toContain("**Directory:** src");
			expect(result).toContain("**Directory:** tests");
			expect(result).toContain("**Repository:** /repo2");
			expect(result).toContain("(root)");

			// Check commits
			expect(result).toContain("[main] First commit");
			expect(result).toContain("[feature] Add tests");
			expect(result).toContain("[main] Root commit");
		});
	});

	describe("time formatting", () => {
		it("should format minutes correctly", async () => {
			const stats: DailyStats[] = [
				{
					date: new Date(),
					firstCommitTime: new Date(),
					lastCommitTime: new Date(),
					totalTimeSpent: 45,
					commits: [],
				},
			];

			const result = await reporter.generateReport(stats);
			expect(result).toContain("45 minutes");
		});

		it("should format hours correctly", async () => {
			const stats: DailyStats[] = [
				{
					date: new Date(),
					firstCommitTime: new Date(),
					lastCommitTime: new Date(),
					totalTimeSpent: 120,
					commits: [],
				},
			];

			const result = await reporter.generateReport(stats);
			expect(result).toContain("2 hours");
		});

		it("should format hours and minutes correctly", async () => {
			const stats: DailyStats[] = [
				{
					date: new Date(),
					firstCommitTime: new Date(),
					lastCommitTime: new Date(),
					totalTimeSpent: 150,
					commits: [],
				},
			];

			const result = await reporter.generateReport(stats);
			expect(result).toContain("2 hours 30 minutes");
		});
	});
});
