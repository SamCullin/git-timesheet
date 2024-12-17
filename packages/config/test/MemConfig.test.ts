import { beforeEach, describe, expect, it } from "bun:test";
import { MemConfigStore } from "../src/MemConfig";
import { type Config, configSchema } from "../src/schema";

describe("MemConfigStore", () => {
    let store: MemConfigStore<typeof configSchema>;

    beforeEach(() => {
        store = new MemConfigStore(configSchema);
    });

    describe("initialization", () => {
        it("should initialize with default values", () => {
            const config = store.all();
            expect(config.defaultTimeWindow).toEqual({ unit: "week", value: 1 });
            expect(config.defaultFormat).toBe("markdown");
            expect(config.repositories).toEqual([]);
            expect(config.authors).toEqual({ include: [], exclude: [] });
            expect(config.workingHours).toEqual({
                start: "09:00",
                end: "17:00",
                excludeWeekends: true,
            });
        });
    });

    describe("get", () => {
        it("should get specific values", () => {
            expect(store.get("defaultFormat")).toBe("markdown");
            expect(store.get("repositories")).toEqual([]);
        });
    });

    describe("set", () => {
        it("should set single valid value", () => {
            store.set("defaultFormat", "json");
            expect(store.get("defaultFormat")).toBe("json");
        });

        it("should set valid object", () => {
            store.set({
                defaultFormat: "json",
                defaultTimeWindow: { unit: "month", value: 3 },
            });
            expect(store.get("defaultFormat")).toBe("json");
            expect(store.get("defaultTimeWindow")).toEqual({ unit: "month", value: 3 });
        });

        it("should throw on invalid key", () => {
            expect(() => {
                store.set("invalidKey" as keyof Config, "value");
            }).toThrow("Invalid key");
        });

        it("should throw on invalid value for key", () => {
            expect(() => {
                store.set("defaultFormat", "invalid-format" as Config["defaultFormat"]);
            }).toThrow("Invalid value");
        });

        it("should throw on invalid object", () => {
            expect(() => {
                store.set({
                    defaultFormat: "invalid-format" as Config["defaultFormat"],
                });
            }).toThrow("Invalid object");
        });

        it("should validate working hours format", () => {
            expect(() => {
                store.set("workingHours", {
                    start: "invalid-time",
                    end: "17:00",
                    excludeWeekends: true,
                });
            }).toThrow();

            expect(() => {
                store.set("workingHours", {
                    start: "25:00", // invalid hour
                    end: "17:00",
                    excludeWeekends: true,
                });
            }).toThrow();
        });

        it("should validate time window values", () => {
            expect(() => {
                store.set("defaultTimeWindow", {
                    unit: "week",
                    value: -1, // negative value
                });
            }).toThrow();

            expect(() => {
                store.set("defaultTimeWindow", {
                    unit: "invalid-unit" as Config["defaultTimeWindow"]["unit"],
                    value: 1,
                });
            }).toThrow();
        });
    });

    describe("reset", () => {
        it("should reset to default values", () => {
            // Set some non-default values
            store.set({
                defaultFormat: "json",
                defaultTimeWindow: { unit: "month", value: 3 },
                repositories: [{ path: "/test/repo" }],
            });

            // Reset
            store.reset();

            // Verify defaults are restored
            const config = store.all();
            expect(config.defaultFormat).toBe("markdown");
            expect(config.defaultTimeWindow).toEqual({ unit: "week", value: 1 });
            expect(config.repositories).toEqual([]);
        });
    });

    describe("all", () => {
        it("should return complete config object", () => {
            const config = store.all();
            expect(config).toEqual(configSchema.parse({}));
        });

        it("should return updated config after changes", () => {
            store.set("defaultFormat", "json");
            store.set("repositories", [{ path: "/test/repo" }]);

            const config = store.all();
            expect(config.defaultFormat).toBe("json");
            expect(config.repositories).toEqual([{ path: "/test/repo" }]);
        });
    });
});
