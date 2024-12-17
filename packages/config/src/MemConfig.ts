import type { z } from "zod";
import type { IConfigStore } from "../src/ZodConf";

export class MemConfigStore<T extends z.ZodObject<z.ZodRawShape>>
    implements IConfigStore<z.infer<T>>
{
    private schema: T;
    private config: z.infer<T>;

    constructor(schema: T) {
        this.config = schema.parse({});
        this.schema = schema;
    }

    get<Key extends keyof z.infer<T>>(key: Key): z.infer<T>[Key] {
        return this.config[key];
    }

    set<Key extends keyof z.infer<T>>(key: Key, value: z.infer<T>[Key]): void;
    set(key: string, value: unknown): void;
    set(object: Partial<z.infer<T>>): void;
    set(key_obj: unknown, value?: unknown): void {
        if (typeof key_obj === "string") {
            // Get the schema for this specific key
            const shape = this.schema.shape[key_obj as keyof typeof this.schema.shape];
            if (!shape) {
                throw new Error(`Invalid key: ${key_obj}`);
            }

            // Validate the value
            const result = shape.safeParse(value);
            if (!result.success) {
                throw new Error(`Invalid value for ${key_obj}: ${result.error.message}`);
            }

            this.config = {
                ...this.config,
                [key_obj]: result.data,
            };
        } else if (typeof key_obj === "object") {
            // Validate the partial object
            const result = this.schema.partial().safeParse(key_obj);
            if (!result.success) {
                throw new Error(`Invalid object: ${result.error.message}`);
            }

            this.config = {
                ...this.config,
                ...result.data,
            };
        }
    }

    all(): z.infer<T> {
        return this.config;
    }

    reset(): void {
        this.config = this.schema.parse({});
    }
}
