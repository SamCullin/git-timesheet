import type { LogInfo } from "@git-timesheet/vcs";

export interface DailyStats {
    date: Date;
    firstCommitTime: Date;
    lastCommitTime: Date;
    totalTimeSpent: number; // in minutes
    commits: LogInfo[];
}

export interface TimeRange {
    startDate: Date;
    endDate: Date;
}

export type TimeWindowUnit = "day" | "week" | "month" | "year";

export interface TimeWindow {
    unit: TimeWindowUnit;
    value: number;
}
