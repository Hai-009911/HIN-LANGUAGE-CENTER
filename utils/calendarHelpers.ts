// Get all days in the current week, starting from Monday
export const getWeek = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        return day;
    });
};

// Create a consistent 'YYYY-MM-DD' identifier for a date object
export const getDayIdentifier = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Create a consistent identifier for an hour
export const getHourIdentifier = (hour: number): string => {
    return hour.toString().padStart(2, '0');
};
