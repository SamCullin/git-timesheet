import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { CommitInfo, DailyStats, ReportGenerator, TimeRange, VcsProvider } from "./interfaces";
import { TimeSheet } from "./timesheet";

type DateConstructorArgs =
    | [string | number | Date]
    | [number, number?, number?, number?, number?, number?, number?];
type MockCalls<T> = { mock: { calls: T[][] } };

describe("TimeSheet", () => {
    let mockVcs: VcsProvider;
    let mockReporter: ReportGenerator;
    let timesheet: TimeSheet;

    beforeEach(() => {
        // Reset mocks before each test
        mockVcs = {
            getCommits: mock(() => Promise.resolve([])),
            getCurrentBranch: mock(() => Promise.resolve("main")),
            getCurrentRepository: mock(() => Promise.resolve("/test/repo")),
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

            await timesheet.generateReport(timeRange);

            expect(mockVcs.getCommits).toHaveBeenCalledWith(timeRange);
            expect(mockReporter.generateReport).toHaveBeenCalledWith([]);
        });

        it("should group commits by day", async () => {
            const commits: CommitInfo[] = [
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

            mockVcs.getCommits = mock(() => Promise.resolve(commits));

            const timeRange: TimeRange = {
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            };

            await timesheet.generateReport(timeRange);

            const reporterCalls = (
                mockReporter.generateReport as unknown as MockCalls<DailyStats[]>
            ).mock.calls;
            expect(reporterCalls).toHaveLength(1);

            const dailyStats = reporterCalls[0]?.[0];
            expect(dailyStats).toBeDefined();
            expect(dailyStats).toHaveLength(2); // Two days

            // Check first day stats
            const firstDay = dailyStats?.[0];
            expect(firstDay).toBeDefined();
            if (firstDay) {
                expect(firstDay.date.toISOString().split("T")[0]).toBe("2024-01-10");
                expect(firstDay.commits).toHaveLength(2);
                expect(firstDay.firstCommitTime).toEqual(new Date("2024-01-10T09:00:00Z"));
                expect(firstDay.lastCommitTime).toEqual(new Date("2024-01-10T17:00:00Z"));
                expect(firstDay.totalTimeSpent).toBe(480); // 8 hours in minutes
            }

            // Check second day stats
            const secondDay = dailyStats?.[1];
            expect(secondDay).toBeDefined();
            if (secondDay) {
                expect(secondDay.date.toISOString().split("T")[0]).toBe("2024-01-11");
                expect(secondDay.commits).toHaveLength(1);
                expect(secondDay.firstCommitTime).toEqual(new Date("2024-01-11T10:00:00Z"));
                expect(secondDay.lastCommitTime).toEqual(new Date("2024-01-11T10:00:00Z"));
                expect(secondDay.totalTimeSpent).toBe(0); // Same time for first and last commit
            }
        });

        it("should handle commits out of order", async () => {
            const commits: CommitInfo[] = [
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

            mockVcs.getCommits = mock(() => Promise.resolve(commits));

            const timeRange: TimeRange = {
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            };

            await timesheet.generateReport(timeRange);

            const reporterCalls = (
                mockReporter.generateReport as unknown as MockCalls<DailyStats[]>
            ).mock.calls;
            const dailyStats = reporterCalls[0]?.[0];
            expect(dailyStats).toBeDefined();
            expect(dailyStats).toHaveLength(1);

            const day = dailyStats?.[0];
            expect(day).toBeDefined();
            if (day) {
                expect(day.firstCommitTime).toEqual(new Date("2024-01-10T09:00:00Z"));
                expect(day.lastCommitTime).toEqual(new Date("2024-01-10T17:00:00Z"));
                expect(day.totalTimeSpent).toBe(480);
            }
        });
    });

    describe("generateReportByWindow", () => {
        let fixedDate: Date;
        let RealDate: DateConstructor;

        beforeEach(() => {
            // Save the real Date constructor
            RealDate = global.Date;
            // Mock Date.now() to return a fixed date
            fixedDate = new Date("2024-01-16T12:00:00Z");
            global.Date = class extends RealDate {
                constructor(...args: DateConstructorArgs) {
                    if ((args as unknown as number[]).length === 0) {
                        super(fixedDate);
                    } else {
                        const ars = args[0] as unknown as number[];
                        //@ts-ignore
                        super(...ars);
                    }
                }
                static override now() {
                    return fixedDate.getTime();
                }
            } as DateConstructor;
        });

        afterEach(() => {
            // Restore the real Date constructor
            global.Date = RealDate;
        });

        it("should calculate correct time range for days", async () => {
            const window = { unit: "day" as const, value: 7 };
            await timesheet.generateReportByWindow(window);

            const vcsCall = (mockVcs.getCommits as unknown as MockCalls<TimeRange>).mock
                .calls[0]?.[0];
            expect(vcsCall).toBeDefined();
            if (vcsCall) {
                expect(vcsCall.startDate.toISOString().split("T")[0]).toBe("2024-01-09");
                expect(vcsCall.endDate.toISOString().split("T")[0]).toBe("2024-01-16");
            }
        });

        it("should calculate correct time range for weeks", async () => {
            const window = { unit: "week" as const, value: 2 };
            await timesheet.generateReportByWindow(window);

            const vcsCall = (mockVcs.getCommits as unknown as MockCalls<TimeRange>).mock
                .calls[0]?.[0];
            expect(vcsCall).toBeDefined();
            if (vcsCall) {
                expect(vcsCall.startDate.toISOString().split("T")[0]).toBe("2024-01-02");
                expect(vcsCall.endDate.toISOString().split("T")[0]).toBe("2024-01-16");
            }
        });

        it("should calculate correct time range for months", async () => {
            const window = { unit: "month" as const, value: 1 };
            await timesheet.generateReportByWindow(window);

            const vcsCall = (mockVcs.getCommits as unknown as MockCalls<TimeRange>).mock
                .calls[0]?.[0];
            expect(vcsCall).toBeDefined();
            if (vcsCall) {
                expect(vcsCall.startDate.toISOString().split("T")[0]).toBe("2023-12-16");
                expect(vcsCall.endDate.toISOString().split("T")[0]).toBe("2024-01-16");
            }
        });

        it("should calculate correct time range for years", async () => {
            const window = { unit: "year" as const, value: 1 };
            await timesheet.generateReportByWindow(window);

            const vcsCall = (mockVcs.getCommits as unknown as MockCalls<TimeRange>).mock
                .calls[0]?.[0];
            expect(vcsCall).toBeDefined();
            if (vcsCall) {
                expect(vcsCall.startDate.toISOString().split("T")[0]).toBe("2023-01-16");
                expect(vcsCall.endDate.toISOString().split("T")[0]).toBe("2024-01-16");
            }
        });
    });
});
