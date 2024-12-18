import { type TimeRange, type TimeWindow, type TimeWindowUnit } from "./interfaces";

export const parseWindow = (window: string): TimeWindow => {
    const match = window.match(/^(\d+)([dwmy])$/);
    if (!match) throw new Error("Invalid window format. Use format like 1d, 1w, 1m, 1y");
    if (match.length !== 3)
        throw new Error("Invalid window format. Use format like 1d, 1w, 1m, 1y");
    const [, value, unit] = match;
    if (!value || !unit) throw new Error("Invalid window format. Use format like 1d, 1w, 1m, 1y");
    return {
        value: parseInt(value, 10),
        unit: unit as TimeWindowUnit,
    };
};

export const windowToRange = (window: TimeWindow): TimeRange => {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - window.value);
    return {
        startDate,
        endDate: now,
    };
};
