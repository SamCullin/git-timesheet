import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { ReportGenerator } from "@git-timesheet/reporter";
import type { LogInfo, VcsProvider } from "@git-timesheet/vcs";
import type { TimeRange } from "./interfaces";
import { TimeSheet } from "./timesheet";

type MockCalls<T> = { mock: { calls: T[][] } };

describe("TimeSheet", () => {
    let mockVcs: VcsProvider;
    let mockReporter: ReportGenerator;
    let timesheet: TimeSheet;

    beforeEach(() => {
        // Reset mocks before each test
        mockVcs = {
            getLog: mock(() => Promise.resolve([])),
        };

        mockReporter = {
            generateReport: mock(() => Promise.resolve("Test Report")),
        };

        timesheet = new TimeSheet(mockVcs, mockReporter);
    });

    describe("generateReport", () => {
        it("should generate report for empty commits", async () => {
            const timeRange: TimeRange = {
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            };

            await timesheet.generateReport({ timeRange, repositories: ["/test/repo"] });

            expect(mockVcs.getLog).toHaveBeenCalledWith({
                date_range: timeRange,
                repositories: ["/test/repo"],
            });
            expect(mockReporter.generateReport).toHaveBeenCalledWith([]);
        });

        it("should pass commits to reporter", async () => {
            const commits: LogInfo[] = [
                {
                    hash: "abc123",
                    datetime: new Date("2024-01-10T09:00:00Z"),
                    message: "First commit",
                    repository: "/test/repo",
                    targetDirectory: "src",
                    branch: "main",
                },
                {
                    hash: "def456",
                    datetime: new Date("2024-01-10T17:00:00Z"),
                    message: "Second commit",
                    repository: "/test/repo",
                    targetDirectory: "src",
                    branch: "main",
                },
                {
                    hash: "ghi789",
                    datetime: new Date("2024-01-11T10:00:00Z"),
                    message: "Next day commit",
                    repository: "/test/repo",
                    targetDirectory: "tests",
                    branch: "feature",
                },
            ];

            mockVcs.getLog = mock(() => Promise.resolve(commits));

            const timeRange: TimeRange = {
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            };

            await timesheet.generateReport({ timeRange, repositories: ["/test/repo"] });

            const reporterCalls = (mockReporter.generateReport as unknown as MockCalls<LogInfo[]>)
                .mock.calls;
            expect(reporterCalls).toHaveLength(1);

            const logs = reporterCalls[0]?.[0];
            expect(logs).toBeDefined();
            expect(logs).toHaveLength(commits.length);
            expect(logs).toEqual(commits);
        });

        it("should handle commits out of order", async () => {
            const commits: LogInfo[] = [
                {
                    hash: "abc123",
                    datetime: new Date("2024-01-10T17:00:00Z"), // Later commit first
                    message: "Second commit",
                    repository: "/test/repo",
                    targetDirectory: "src",
                    branch: "main",
                },
                {
                    hash: "def456",
                    datetime: new Date("2024-01-10T09:00:00Z"), // Earlier commit second
                    message: "First commit",
                    repository: "/test/repo",
                    targetDirectory: "src",
                    branch: "main",
                },
            ];

            mockVcs.getLog = mock(() => Promise.resolve(commits));

            const timeRange: TimeRange = {
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            };

            await timesheet.generateReport({ timeRange, repositories: ["/test/repo"] });

            const reporterCalls = (mockReporter.generateReport as unknown as MockCalls<LogInfo[]>)
                .mock.calls;
            const logs = reporterCalls[0]?.[0];
            expect(logs).toBeDefined();
            expect(logs).toHaveLength(commits.length);
            expect(logs).toEqual(commits);
        });
    });
});
