export interface CommitInfo {
	datetime: Date;
	repository: string;
	targetDirectory: string;
	branch: string;
	message: string;
	hash: string;
}

export interface DailyStats {
	date: Date;
	firstCommitTime: Date;
	lastCommitTime: Date;
	totalTimeSpent: number; // in minutes
	commits: CommitInfo[];
}

export interface TimeRange {
	startDate: Date;
	endDate: Date;
}

export interface TimeWindow {
	unit: "day" | "week" | "month" | "year";
	value: number;
}

export interface VcsProvider {
	getCommits(timeRange: TimeRange): Promise<CommitInfo[]>;
	getCurrentBranch(): Promise<string>;
	getCurrentRepository(): Promise<string>;
}

export interface ReportGenerator {
	generateReport(stats: DailyStats[]): Promise<string>;
}
