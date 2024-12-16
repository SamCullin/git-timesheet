import type { DailyStats, ReportGenerator } from "@git-timesheet/core";

export class MarkdownReporter implements ReportGenerator {
	async generateReport(stats: DailyStats[]): Promise<string> {
		if (stats.length === 0) {
			return "# Git TimeSheet Report\n\nNo commits found in the specified time range.";
		}

		const totalDays = stats.length;
		const totalCommits = stats.reduce(
			(sum, day) => sum + day.commits.length,
			0,
		);
		const totalTimeSpent = stats.reduce(
			(sum, day) => sum + day.totalTimeSpent,
			0,
		);

		const report = [
			"# Git TimeSheet Report",
			"",
			"## Summary",
			"",
			`- Total Days: ${totalDays}`,
			`- Total Commits: ${totalCommits}`,
			`- Total Time Spent: ${this.formatMinutes(totalTimeSpent)}`,
			"",
			"## Daily Breakdown",
			"",
		];

		// Sort days in descending order
		const sortedStats = [...stats].sort(
			(a, b) => b.date.getTime() - a.date.getTime(),
		);

		for (const day of sortedStats) {
			report.push(this.generateDailyReport(day));
		}

		return report.join("\n");
	}

	private generateDailyReport(day: DailyStats): string {
		const date = day.date.toISOString().split("T")[0];
		const firstCommitTime = day.firstCommitTime.toLocaleTimeString();
		const lastCommitTime = day.lastCommitTime.toLocaleTimeString();

		const report = [
			`### ${date}`,
			"",
			`- First Commit: ${firstCommitTime}`,
			`- Last Commit: ${lastCommitTime}`,
			`- Time Spent: ${this.formatMinutes(day.totalTimeSpent)}`,
			`- Total Commits: ${day.commits.length}`,
			"",
			"#### Commits",
			"",
		];

		// Group commits by repository and directory
		const commitsByRepo = this.groupCommits(day.commits);

		for (const [repo, directories] of Object.entries(commitsByRepo)) {
			report.push(`**Repository:** ${repo}`);

			for (const [directory, commits] of Object.entries(directories)) {
				if (directory) {
					report.push(`- **Directory:** ${directory}`);
				}

				for (const commit of commits) {
					const time = commit.datetime.toLocaleTimeString();
					report.push(
						`  - \`${commit.hash.slice(0, 7)}\` ` +
							`(${time}) [${commit.branch}] ${commit.message}`,
					);
				}
			}
			report.push("");
		}

		return report.join("\n");
	}

	private groupCommits(
		commits: DailyStats["commits"],
	): Record<string, Record<string, typeof commits>> {
		const grouped: Record<string, Record<string, typeof commits>> = {};

		for (const commit of commits) {
			if (!grouped[commit.repository]) {
				grouped[commit.repository] = {};
			}

			const directory = commit.targetDirectory || "(root)";
			if (!grouped[commit.repository][directory]) {
				grouped[commit.repository][directory] = [];
			}

			grouped[commit.repository][directory].push(commit);
		}

		return grouped;
	}

	private formatMinutes(minutes: number): string {
		if (minutes < 60) {
			return `${minutes} minutes`;
		}

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		if (remainingMinutes === 0) {
			return `${hours} hours`;
		}

		return `${hours} hours ${remainingMinutes} minutes`;
	}
}
