import type { LogInfo } from "@git-timesheet/vcs";

export interface ReportGenerator {
    generateReport(log: LogInfo[]): Promise<string>;
}
