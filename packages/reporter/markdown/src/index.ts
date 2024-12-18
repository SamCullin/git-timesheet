import path from "node:path";
import type { ReportGenerator } from "@git-timesheet/reporter";
import type { LogInfo } from "@git-timesheet/vcs";

export class MarkdownReporter implements ReportGenerator {
    async generateReport(logs: LogInfo[]): Promise<string> {
        if (logs.length === 0) {
            return "# Git TimeSheet Report\n\nNo commits found in the specified time range.";
        }

        const totalCommits = logs.length;

        const report = [
            "# Git TimeSheet Report",
            "",
            "## Summary",
            "",
            `- Total Commits: ${totalCommits}`,
            "",
            "## Commits",
            "",
        ];

        // Sort commits in descending order
        const sortedCommits = [...logs].sort((a, b) => b.datetime.getTime() - a.datetime.getTime());

        for (const commit of sortedCommits) {
            const time = commit.datetime.toLocaleTimeString();
            const date = commit.datetime.toISOString().split("T")[0];
            report.push(
                `### ${date} (${time})`,
                `- \`${commit.hash.slice(0, 7)}\` [${path.basename(commit.repository)}] [${
                    commit.branch
                }] ${commit.message}`,
                "",
            );
        }

        return report.join("\n");
    }
}
