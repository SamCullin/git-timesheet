import path from "node:path";
import type { ReportGenerator } from "@git-timesheet/reporter";
import type { LogInfo } from "@git-timesheet/vcs";

// example output 1 hour, 34 minutes
const prettyRenderTime = (timeMs: number) => {
    const diffMinutes = Math.floor(timeMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    let timeString = "";
    if (hours > 0) {
        timeString += `${hours} hour${hours === 1 ? "" : "s"}`;
        if (minutes > 0) timeString += ", ";
    }
    if (minutes > 0 || hours === 0) {
        timeString += `${minutes} minute${minutes === 1 ? "" : "s"}`;
    }

    return timeString;
};

export class MarkdownReporter implements ReportGenerator {
    async generateReport(logs: LogInfo[]): Promise<string> {
        if (logs.length === 0) {
            return "# Git TimeSheet Report\n\nNo commits found in the specified time range.";
        }

        const ranges: [Date, Date][] = [];

        const totalCommits = logs.length;
        const totalDays = new Set(logs.map((log) => log.datetime.toISOString().split("T")[0])).size;

        const report = [];

        // Sort commits in descending order
        const sortedCommits = [...logs].sort((a, b) => b.datetime.getTime() - a.datetime.getTime());
        const groupedCommits = sortedCommits.reduce(
            (acc, log) => {
                const date = log.datetime.toISOString().split("T")[0];
                if (!date) return acc;
                acc[date] = acc[date] ?? [];
                acc[date].push(log);
                return acc;
            },
            {} as Record<string, LogInfo[]>,
        );

        for (const date of Object.keys(groupedCommits).sort().reverse()) {
            const dayCommits = groupedCommits[date] ?? [];
            const firstCommit = dayCommits[dayCommits.length - 1];
            const lastCommit = dayCommits[0];

            if (!firstCommit || !lastCommit) continue;

            const timeRange = `[${firstCommit.datetime.toLocaleTimeString()} - ${lastCommit.datetime.toLocaleTimeString()}]`;

            report.push(
                `### ${date} (${prettyRenderTime(
                    lastCommit.datetime.getTime() - firstCommit.datetime.getTime(),
                )}) ${timeRange}`,
            );
            ranges.push([firstCommit.datetime, lastCommit.datetime]);

            for (const commit of dayCommits) {
                const time = commit.datetime.toLocaleTimeString();
                report.push(
                    `- \`${commit.hash.slice(0, 7)}\` (${time}) [${path.basename(
                        commit.repository,
                    )}][${commit.branch}] ${commit.message}`,
                );
            }
            report.push("");
        }

        const totalTimeSpent = ranges.reduce((acc, [from, to]) => {
            const diffMs = to.getTime() - from.getTime();
            return acc + diffMs;
        }, 0);

        const summary = [
            "# Git TimeSheet Report",
            "",
            "## Summary",
            `Total Days: ${totalDays}`,
            `Total Commits: ${totalCommits}`,
            `Total Time Spent: ${prettyRenderTime(totalTimeSpent)}`,
            "",
            "## Daily Breakdown",
            "",
        ];

        report.unshift(...summary);

        return report.join("\n");
    }
}
