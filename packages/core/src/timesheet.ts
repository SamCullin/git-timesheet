import type { ReportGenerator } from "@git-timesheet/reporter";
import type { VcsProvider } from "@git-timesheet/vcs";
import type { TimeRange } from "./interfaces";

type Options = {
    timeRange: TimeRange;
    authors?: string[];
    repositories: string[];
};

export class TimeSheet {
    constructor(private vcsProvider: VcsProvider, private reportGenerator: ReportGenerator) {}

    async generateReport(options: Options): Promise<string> {
        const commits = await this.vcsProvider.getLog({
            repositories: options.repositories,
            date_range: options.timeRange,
        });
        return this.reportGenerator.generateReport(commits);
    }
}
