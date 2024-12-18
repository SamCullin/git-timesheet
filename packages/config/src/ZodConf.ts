import Conf from "conf";
import { z } from "zod";

export class ZodConf<T extends z.ZodObject<z.ZodRawShape>>
    extends Conf<z.infer<T>>
    implements IConfigStore<z.infer<T>>
{
    private schema: T;

    constructor(schema: T) {
        const defaults: z.infer<T> = schema.parse({});
        super({
            configName: "@git-timesheet/cli",
            projectName: "@git-timesheet/cli",
            defaults,
        });

        this.schema = schema;
    }

    override set<Key extends keyof z.infer<T>>(key: Key, value?: z.infer<T>[Key]): void;
    override set(key: string, value: unknown): void;
    override set(object: Partial<z.infer<T>>): void;
    override set(key_obj: string | Partial<z.infer<T>>, value?: unknown): void {
        if (typeof key_obj === "string") {
            const schema = this.schema.shape[key_obj];
            if (!schema) {
                throw new Error(`No schema found for key: ${String(key_obj)}`);
            }
            const result = schema.safeParse(value);
            if (!result.success) {
                throw new Error(`Invalid value for ${String(key_obj)}: ${result.error.message}`);
            }
            super.set(key_obj, result.data);
        } else {
            const parsed = this.schema.safeParse(key_obj);
            if (!parsed.success) {
                throw new Error(`Invalid value for ${String(key_obj)}: ${parsed.error.message}`);
            }
            super.set(parsed.data);
        }
    }

    all(): z.infer<T> {
        return this.store;
    }

    override reset(): void {
        this.set(this.schema.parse({}));
    }
}

export interface IConfigStore<T> {
    get<Key extends keyof T>(key: Key): T[Key];
    set<Key extends keyof T>(key: Key, value: T[Key]): void;
    set(object: Partial<T>): void;
    all(): T;
    reset(): void;
}
