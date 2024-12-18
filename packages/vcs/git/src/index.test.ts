import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Response, SimpleGitTaskCallback, TaskOptions } from "simple-git";
import { GitVcsProvider } from "./index";

type MockGit = {
    revparse: (
        option?: string | TaskOptions,
        options?: TaskOptions,
        callback?: SimpleGitTaskCallback<string>,
    ) => Response<string>;
    branch: (
        options?: TaskOptions,
        callback?: SimpleGitTaskCallback<{ current: string }>,
    ) => Response<{
        current: string;
    }>;
    log: <T>(
        options?: TaskOptions,
        callback?: SimpleGitTaskCallback<{ all: T[] }>,
    ) => Response<{ all: T[] }>;
};

describe("GitVcsProvider", () => {
    let mockGit: Partial<MockGit>;
    let provider: GitVcsProvider;

    beforeEach(() => {
        // Reset mocks before each test
        mockGit = {
            revparse: mock(() =>
                Promise.resolve("/home/mullin/code/git-timesheet"),
            ) as unknown as MockGit["revparse"],
            branch: mock(() =>
                Promise.resolve({ current: "main" }),
            ) as unknown as MockGit["branch"],
            log: mock(() => Promise.resolve({ all: [] })) as unknown as MockGit["log"],
        };

        // Mock the simple-git module
        mock.module("simple-git", () => {
            return () => mockGit;
        });

        provider = new GitVcsProvider();
        // Replace the git instance with our mock
        (provider as unknown as { git: typeof mockGit }).git = mockGit;
    });

    describe("getLog", () => {
        it("should return commits within time range", async () => {
            const provider = new GitVcsProvider();

            const result = await provider.getLog({
                repositories: ["."],
                date_range: {
                    startDate: new Date("2024-01-01"),
                    endDate: new Date("2024-12-31"),
                },
            });

            expect(
                result.every((commit) => {
                    const commitDate = new Date(commit.datetime);
                    return (
                        commitDate >= new Date("2024-01-01") && commitDate <= new Date("2024-12-31")
                    );
                }),
            ).toBe(true);
        });

        it("should handle empty commit list", async () => {
            const timeRange = {
                startDate: new Date("2024-01-01"),
                endDate: new Date("2024-01-31"),
            };

            const result = await provider.getLog({
                repositories: ["."],
                date_range: timeRange,
            });
            expect(result).toHaveLength(0);
        });
    });

    describe("branch extraction", () => {
        const testCases = [
            {
                name: "should extract branch from HEAD reference",
                refs: "HEAD -> feature/test",
                expected: "feature/test",
            },
            {
                name: "should extract branch from multiple references",
                refs: "HEAD -> main, origin/main, tag: v1.0.0",
                expected: "main",
            },
            {
                name: "should use current branch when no refs",
                refs: "",
                expected: "main",
            },
            {
                name: "should handle tag-only references",
                refs: "tag: v1.0.0",
                expected: "main",
            },
        ];

        for (const { name, refs, expected } of testCases) {
            it(name, () => {
                const result = provider.extractBranch(refs, "main");
                expect(result).toBe(expected);
            });
        }
    });
});
