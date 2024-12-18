import type { LogInfo, LogQuery, VcsProvider } from "@git-timesheet/vcs";
import type { ListLogLine } from "simple-git";
import simpleGit from "simple-git";

type GitLogType = {
    hash: string;
    date: string;
    message: string;
    body: string;
    refs: string;
} & ListLogLine;

export class GitVcsProvider implements VcsProvider {
    formatLog(_opts: LogQuery, log: GitLogType): LogInfo {
        return {
            datetime: new Date(log.date),
            repository: "",
            targetDirectory: "",
            branch: this.extractBranch(log.refs, ""),
            message: log.message,
            hash: log.hash,
        };
    }

    async getRepository(repo: string, opts: LogQuery): Promise<LogInfo[]> {
        const git = simpleGit(repo);

        const log = await git.log({
            format: {
                hash: "%H",
                date: "%aI",
                message: "%s",
                body: "%b",
                refs: "%D",
            },
            "--all": null,
            "--no-merges": null,
            "--after": opts.date_range.startDate.toISOString().split("T")[0],
            "--before": opts.date_range.endDate.toISOString().split("T")[0],
            "--date": "iso-strict",
            "--name-only": null,
        });

        return log.all.map((commit: GitLogType) => this.formatLog(opts, commit));
    }

    async getLog(opts: LogQuery): Promise<LogInfo[]> {
        // Format date to ISO string and take only the date part
        const logs = await Promise.all(
            opts.repositories.map((repo) => this.getRepository(repo, opts)),
        );
        return logs.flat();
    }

    // Made public for testing
    extractBranch(refs: string, currentBranch: string): string {
        if (!refs) return currentBranch;

        const branches = refs.split(",").map((ref) => ref.trim());

        // Try to find a branch reference
        const branchRef = branches.find(
            (ref) => ref.startsWith("HEAD ->") || (!ref.includes("HEAD") && !ref.includes("tag:")),
        );

        if (!branchRef) return currentBranch;

        // Remove 'HEAD ->' or other prefixes if present
        return branchRef.replace("HEAD ->", "").trim();
    }
}
