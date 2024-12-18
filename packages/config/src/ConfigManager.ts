import type { IConfigStore } from "./ZodConf";
import { type Config } from "./schema";

export class ConfigManager {
    private conf: IConfigStore<Config>;

    constructor(config_store: IConfigStore<Config>) {
        this.conf = config_store;
    }

    get config(): Config {
        return this.conf.all();
    }

    reset(): void {
        this.conf.reset();
    }

    addRepository(path: string, name: string): void {
        const repositories = this.conf.get("repositories");
        repositories.push({ path, name });
        this.conf.set("repositories", repositories);
    }

    removeRepository(path: string): void {
        const repositories = this.conf.get("repositories");
        const index = repositories.findIndex((repo) => repo.path === path || repo.name === path);
        if (index !== -1) {
            repositories.splice(index, 1);
            this.conf.set("repositories", repositories);
        }
    }

    addAuthor(author: string, exclude = false): void {
        const authors = this.conf.get("authors");
        const list = exclude ? authors.exclude : authors.include;
        if (!list.includes(author)) {
            list.push(author);
            this.conf.set("authors", authors);
        }
    }

    removeAuthor(author: string, exclude = false): void {
        const authors = this.conf.get("authors");
        const list = exclude ? authors.exclude : authors.include;
        const index = list.indexOf(author);
        if (index !== -1) {
            list.splice(index, 1);
            this.conf.set("authors", authors);
        }
    }

    setWorkingHours(start: string, end: string, excludeWeekends = true): void {
        this.conf.set("workingHours", { start, end, excludeWeekends });
    }

    setDefaultTimeWindow(unit: Config["defaultTimeWindow"]["unit"], value: number): void {
        this.conf.set("defaultTimeWindow", { unit, value });
    }

    setDefaultFormat(format: Config["defaultFormat"]): void {
        this.conf.set("defaultFormat", format);
    }
}
