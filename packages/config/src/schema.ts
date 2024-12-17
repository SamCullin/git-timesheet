import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const configSchema = z.object({
    // Default time window for reports
    defaultTimeWindow: z
        .object({
            unit: z.enum(["day", "week", "month", "year"]),
            value: z.number().int().positive(),
        })
        .default({
            unit: "week",
            value: 1,
        }),

    // Default output format
    defaultFormat: z.enum(["markdown", "json", "html"]).default("markdown"),

    // Git repositories to track
    repositories: z
        .array(
            z.object({
                path: z.string(),
                name: z.string().optional(),
                branch: z.string().optional(),
            }),
        )
        .default([]),

    // Authors to include/exclude
    authors: z
        .object({
            include: z.array(z.string()).default([]),
            exclude: z.array(z.string()).default([]),
        })
        .default({
            include: [],
            exclude: [],
        }),

    // Working hours for time calculations
    workingHours: z
        .object({
            start: z
                .string()
                .regex(timeRegex, "Invalid time format. Use HH:MM (24-hour format)")
                .refine((time) => {
                    const [hours, minutes] = time.split(":").map(Number);
                    return (
                        typeof hours !== "undefined" &&
                        hours >= 0 &&
                        hours < 24 &&
                        typeof minutes !== "undefined" &&
                        minutes >= 0 &&
                        minutes < 60
                    );
                }, "Invalid time value")
                .default("09:00"),
            end: z
                .string()
                .regex(timeRegex, "Invalid time format. Use HH:MM (24-hour format)")
                .refine((time) => {
                    const [hours, minutes] = time.split(":").map(Number);
                    return (
                        typeof hours !== "undefined" &&
                        hours >= 0 &&
                        hours < 24 &&
                        typeof minutes !== "undefined" &&
                        minutes >= 0 &&
                        minutes < 60
                    );
                }, "Invalid time value")
                .default("17:00"),
            excludeWeekends: z.boolean().default(true),
        })
        .default({
            start: "09:00",
            end: "17:00",
            excludeWeekends: true,
        }),
});

export type Config = z.infer<typeof configSchema>;
