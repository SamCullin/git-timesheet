import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { DiffResult } from "simple-git";
import { GitVcsProvider } from "./index";

describe("GitVcsProvider", () => {
	let mockGit: any;
	let provider: GitVcsProvider;

	beforeEach(() => {
		// Reset mocks before each test
		mockGit = {
			revparse: mock(() => Promise.resolve("/home/mullin/code/git-timesheet")),
			branch: mock(() => Promise.resolve({ current: "main" })),
			log: mock(() => Promise.resolve({ all: [] })),
		};

		// Mock the simple-git module
		mock.module("simple-git", () => {
			return () => mockGit;
		});

		provider = new GitVcsProvider();
		// Replace the git instance with our mock
		(provider as any).git = mockGit;
	});

	describe("getCurrentRepository", () => {
		it("should return parent directory of git root", async () => {
			const result = await provider.getCurrentRepository();
			expect(result).toBe("/home/mullin/code");
			expect(mockGit.revparse).toHaveBeenCalledWith(["--show-toplevel"]);
		});

		it("should throw error for non-git repository", async () => {
			mockGit.revparse = mock(() => Promise.reject(new Error()));
			await expect(provider.getCurrentRepository()).rejects.toThrow(
				"Not a git repository",
			);
		});
	});

	describe("getCurrentBranch", () => {
		it("should return current branch name", async () => {
			const result = await provider.getCurrentBranch();
			expect(result).toBe("main");
			expect(mockGit.branch).toHaveBeenCalled();
		});
	});

	describe("getCommits", () => {
		it("should return commits within time range", async () => {
			const timeRange = {
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-01-31"),
			};

			const mockCommits = {
				all: [
					{
						hash: "abc1234",
						date: "2024-01-10T10:00:00Z",
						message: "Test commit",
						body: "",
						refs: "HEAD -> main",
						diff: {
							files: [{ file: "src/test.ts" }],
							changed: 1,
							insertions: 10,
							deletions: 5,
						} as DiffResult,
					},
				],
			};

			mockGit.log = mock(() => Promise.resolve(mockCommits));

			const result = await provider.getCommits(timeRange);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				hash: "abc1234",
				datetime: new Date("2024-01-10T10:00:00Z"),
				message: "Test commit",
				repository: "/home/mullin/code/git-timesheet",
				targetDirectory: "src",
				branch: "main",
			});

			expect(mockGit.log).toHaveBeenCalledWith({
				format: {
					hash: "%H",
					date: "%aI",
					message: "%s",
					body: "%b",
					refs: "%D",
				},
				"--all": null,
				"--no-merges": null,
				"--after": "2024-01-01",
				"--before": "2024-01-31",
				"--date": "iso-strict",
				"--name-only": null,
			});
		});

		it("should handle empty commit list", async () => {
			const timeRange = {
				startDate: new Date("2024-01-01"),
				endDate: new Date("2024-01-31"),
			};

			const result = await provider.getCommits(timeRange);
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
