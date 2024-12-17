import { beforeEach, describe, expect, it } from "bun:test";
import { MemConfigStore } from "../src/MemConfig";
import { type Config, ConfigManager, configSchema } from "../src/index";

describe("ConfigManager", () => {
    let config: ConfigManager;

    beforeEach(() => {
        config = new ConfigManager(new MemConfigStore(configSchema));
        config.reset();
    });

    describe("default values", () => {
        it("should have default time window", () => {
            const timeWindow = config.config.defaultTimeWindow;
            expect(timeWindow.unit).toBe("week");
            expect(timeWindow.value).toBe(1);
        });

        it("should have default format", () => {
            expect(config.config.defaultFormat).toBe("markdown");
        });

        it("should have default working hours", () => {
            const workingHours = config.config.workingHours;
            expect(workingHours.start).toBe("09:00");
            expect(workingHours.end).toBe("17:00");
            expect(workingHours.excludeWeekends).toBe(true);
        });

        it("should have empty repositories", () => {
            expect(config.config.repositories).toEqual([]);
        });

        it("should have empty authors", () => {
            const authors = config.config.authors;
            expect(authors.include).toEqual([]);
            expect(authors.exclude).toEqual([]);
        });
    });

    describe("repositories", () => {
        it("should add repository", () => {
            config.addRepository("/test/repo", "Test Repo", "main");
            const repos = config.config.repositories;
            expect(repos).toEqual([{ path: "/test/repo", name: "Test Repo", branch: "main" }]);
        });

        it("should add repository without optional fields", () => {
            config.addRepository("/test/repo");
            const repos = config.config.repositories;
            expect(repos).toEqual([{ path: "/test/repo" }]);
        });

        it("should remove repository", () => {
            config.addRepository("/test/repo1");
            config.addRepository("/test/repo2");
            config.removeRepository("/test/repo1");
            const repos = config.config.repositories;
            expect(repos).toEqual([{ path: "/test/repo2" }]);
        });
    });

    describe("authors", () => {
        it("should add included author", () => {
            config.addAuthor("John Doe");
            const authors = config.config.authors;
            expect(authors.include).toEqual(["John Doe"]);
            expect(authors.exclude).toEqual([]);
        });

        it("should add excluded author", () => {
            config.addAuthor("John Doe", true);
            const authors = config.config.authors;
            expect(authors.include).toEqual([]);
            expect(authors.exclude).toEqual(["John Doe"]);
        });

        it("should not add duplicate authors", () => {
            config.addAuthor("John Doe");
            config.addAuthor("John Doe");
            const authors = config.config.authors;
            expect(authors.include).toEqual(["John Doe"]);
        });

        it("should remove author", () => {
            config.addAuthor("John Doe");
            config.addAuthor("Jane Doe");
            config.removeAuthor("John Doe");
            const authors = config.config.authors;
            expect(authors.include).toEqual(["Jane Doe"]);
        });
    });

    describe("working hours", () => {
        it("should set working hours", () => {
            config.setWorkingHours("10:00", "18:00", false);
            const workingHours = config.config.workingHours;
            expect(workingHours).toEqual({
                start: "10:00",
                end: "18:00",
                excludeWeekends: false,
            });
        });

        it("should validate working hours format", () => {
            expect(() => config.setWorkingHours("10:00", "invalid", true)).toThrow();
            expect(() => config.setWorkingHours("25:00", "18:00", true)).toThrow();
        });
    });

    describe("time window", () => {
        it("should set default time window", () => {
            config.setDefaultTimeWindow("month", 3);
            const timeWindow = config.config.defaultTimeWindow;
            expect(timeWindow).toEqual({
                unit: "month",
                value: 3,
            });
        });

        it("should validate time window value", () => {
            expect(() => config.setDefaultTimeWindow("day", -1)).toThrow();
            expect(() => config.setDefaultTimeWindow("day", 0)).toThrow();
        });
    });

    describe("format", () => {
        it("should set default format", () => {
            config.setDefaultFormat("json");
            expect(config.config.defaultFormat).toBe("json");
        });

        it("should validate format value", () => {
            expect(() => config.setDefaultFormat("invalid" as Config["defaultFormat"])).toThrow();
        });
    });

    describe("reset", () => {
        it("should reset to defaults", () => {
            config.setDefaultFormat("json");
            config.addRepository("/test/repo");
            config.addAuthor("John Doe");
            config.reset();

            expect(config.config.defaultFormat).toBe("markdown");
            expect(config.config.repositories).toEqual([]);
            expect(config.config.authors.include).toEqual([]);
        });
    });
});
