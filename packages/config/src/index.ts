import Conf from "conf";
import { z } from "zod";
import { type Config, configSchema } from "./schema";

type ZodShape = z.ZodRawShape;
type ZodTypeAny = z.ZodTypeAny;

interface ConfSchema {
    type: string;
    properties?: Record<string, ConfSchema>;
    items?: Record<string, unknown>;
    enum?: readonly string[];
}

export class ConfigManager {
    private conf: Conf<Config>;

    constructor(configName = "git-timesheet") {
        this.conf = new Conf({
            projectName: configName,
            schema: this.convertZodToConfSchema(configSchema),
            defaults: this.getDefaults(),
        });
    }

    private convertZodToConfSchema(schema: z.ZodObject<ZodShape>): Record<string, ConfSchema> {
        const confSchema: Record<string, ConfSchema> = {};
        const shape = schema._def.shape();

        for (const [key, value] of Object.entries(shape)) {
            if (value instanceof z.ZodObject) {
                confSchema[key] = {
                    type: "object",
                    properties: this.convertZodToConfSchema(value),
                };
            } else if (value instanceof z.ZodArray) {
                confSchema[key] = {
                    type: "array",
                    items: {},
                };
            } else if (value instanceof z.ZodEnum) {
                confSchema[key] = {
                    type: "string",
                    enum: value._def.values,
                };
            } else if (value instanceof z.ZodNumber) {
                confSchema[key] = {
                    type: "number",
                };
            } else if (value instanceof z.ZodString) {
                confSchema[key] = {
                    type: "string",
                };
            } else if (value instanceof z.ZodBoolean) {
                confSchema[key] = {
                    type: "boolean",
                };
            }
        }

        return confSchema;
    }

    private getDefaults(): Config {
        const result = configSchema.safeParse({});
        if (!result.success) {
            throw new Error("Invalid default configuration");
        }
        return result.data;
    }

    get config(): Config {
        return this.conf.store;
    }

    set<K extends keyof Config>(key: K, value: Config[K]): void {
        const schema = configSchema.shape[key] as ZodTypeAny;
        const result = schema.safeParse(value);
        if (!result.success) {
            throw new Error(`Invalid value for ${String(key)}: ${result.error.message}`);
        }
        this.conf.set(key, value);
    }

    get<K extends keyof Config>(key: K): Config[K] {
        return this.conf.get(key);
    }

    reset(): void {
        this.conf.clear();
        this.conf.set(this.getDefaults());
    }

    addRepository(path: string, name?: string, branch?: string): void {
        const repositories = this.get("repositories");
        repositories.push({ path, name, branch });
        this.set("repositories", repositories);
    }

    removeRepository(path: string): void {
        const repositories = this.get("repositories");
        const index = repositories.findIndex((repo) => repo.path === path);
        if (index !== -1) {
            repositories.splice(index, 1);
            this.set("repositories", repositories);
        }
    }

    addAuthor(author: string, exclude = false): void {
        const authors = this.get("authors");
        const list = exclude ? authors.exclude : authors.include;
        if (!list.includes(author)) {
            list.push(author);
            this.set("authors", authors);
        }
    }

    removeAuthor(author: string, exclude = false): void {
        const authors = this.get("authors");
        const list = exclude ? authors.exclude : authors.include;
        const index = list.indexOf(author);
        if (index !== -1) {
            list.splice(index, 1);
            this.set("authors", authors);
        }
    }

    setWorkingHours(start: string, end: string, excludeWeekends = true): void {
        this.set("workingHours", { start, end, excludeWeekends });
    }

    setDefaultTimeWindow(unit: Config["defaultTimeWindow"]["unit"], value: number): void {
        this.set("defaultTimeWindow", { unit, value });
    }

    setDefaultFormat(format: Config["defaultFormat"]): void {
        this.set("defaultFormat", format);
    }
}

export { type Config } from "./schema";
export { configSchema } from "./schema";
