export interface LogInfo {
    datetime: Date;
    repository: string;
    targetDirectory: string;
    branch: string;
    message: string;
    hash: string;
}

export interface TimeRange {
    startDate: Date;
    endDate: Date;
}

export interface LogQuery {
    authors?: string[];
    repositories: string[];
    date_range: TimeRange;
}

export interface VcsProvider {
    getLog(opts: LogQuery): Promise<LogInfo[]>;
}
