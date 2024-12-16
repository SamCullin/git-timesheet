import { dirname } from "node:path";
import type { CommitInfo, TimeRange, VcsProvider } from "@git-timesheet/core";
import simpleGit from "simple-git";
import type { DefaultLogFields, ListLogLine } from "simple-git";

export class GitVcsProvider implements VcsProvider {
    private git = simpleGit();

    private async findGitRoot(): Promise<string> {
        try {
            const result = await this.git.revparse(["--show-toplevel"]);
            return result.trim();
        } catch (_error) {
            throw new Error("Not a git repository");
        }
    }

    async getCurrentRepository(): Promise<string> {
        const gitRoot = await this.findGitRoot();
        return dirname(gitRoot);
    }

    async getCurrentBranch(): Promise<string> {
        const result = await this.git.branch();
        return result.current;
    }

    async getCommits(timeRange: TimeRange): Promise<CommitInfo[]> {
        const gitRoot = await this.findGitRoot();
        const currentBranch = await this.getCurrentBranch();

        // Format date to ISO string and take only the date part
        const from = timeRange.startDate.toISOString().split("T")[0];
        const to = timeRange.endDate.toISOString().split("T")[0];

        const log = await this.git.log<DefaultLogFields & { body: string }>({
            format: {
                hash: "%H",
                date: "%aI",
                message: "%s",
                body: "%b",
                refs: "%D",
            },
            "--all": null,
            "--no-merges": null,
            "--after": from,
            "--before": to,
            "--date": "iso-strict",
            "--name-only": null,
        });

        return log.all.map((commit: ListLogLine & { body: string }) =>
            this.convertCommit(commit, gitRoot, currentBranch),
        );
    }

    private convertCommit(
        commit: ListLogLine & { body: string },
        repoPath: string,
        currentBranch: string,
    ): CommitInfo {
        // Get the first directory from the changed files as the target directory
        const files = commit.diff?.files || [];
        const targetDirectory = files.length > 0 ? dirname(files[0].file).split("/")[0] : "";

        return {
            datetime: new Date(commit.date),
            repository: repoPath,
            targetDirectory,
            branch: this.extractBranch(commit.refs, currentBranch),
            message: commit.message,
            hash: commit.hash,
        };
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
