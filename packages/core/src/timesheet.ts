import type {
    CommitInfo,
    DailyStats,
    ReportGenerator,
    TimeRange,
    TimeWindow,
    VcsProvider,
} from "./interfaces";

export class TimeSheet {
    constructor(private vcsProvider: VcsProvider, private reportGenerator: ReportGenerator) {}

    private calculateTimeWindow(window: TimeWindow): TimeRange {
        const endDate = new Date();
        const startDate = new Date();

        switch (window.unit) {
            case "day":
                startDate.setDate(endDate.getDate() - window.value);
                break;
            case "week":
                startDate.setDate(endDate.getDate() - window.value * 7);
                break;
            case "month":
                startDate.setMonth(endDate.getMonth() - window.value);
                break;
            case "year":
                startDate.setFullYear(endDate.getFullYear() - window.value);
                break;
        }

        return { startDate, endDate };
    }

    private groupCommitsByDay(commits: CommitInfo[]): DailyStats[] {
        const dailyCommits = new Map<string, CommitInfo[]>();

        for (const commit of commits) {
            const dateKey = commit.datetime.toISOString().split("T")[0];
            if (!dailyCommits.has(dateKey)) {
                dailyCommits.set(dateKey, []);
            }
            const commitList = dailyCommits.get(dateKey);
            if (commitList) {
                commitList.push(commit);
            }
        }

        return Array.from(dailyCommits.entries()).map(([dateStr, commits]) => {
            const sortedCommits = commits.sort(
                (a, b) => a.datetime.getTime() - b.datetime.getTime(),
            );
            const firstCommit = sortedCommits[0];
            const lastCommit = sortedCommits[sortedCommits.length - 1];

            return {
                date: new Date(dateStr),
                firstCommitTime: firstCommit.datetime,
                lastCommitTime: lastCommit.datetime,
                totalTimeSpent: Math.round(
                    (lastCommit.datetime.getTime() - firstCommit.datetime.getTime()) / (1000 * 60),
                ),
                commits: sortedCommits,
            };
        });
    }

    async generateReport(timeRange: TimeRange): Promise<string> {
        const commits = await this.vcsProvider.getCommits(timeRange);
        const dailyStats = this.groupCommitsByDay(commits);
        return this.reportGenerator.generateReport(dailyStats);
    }

    async generateReportByWindow(window: TimeWindow): Promise<string> {
        const timeRange = this.calculateTimeWindow(window);
        return this.generateReport(timeRange);
    }
}
