export interface HeatmapDay {
    date: string;
    count: number;
    level: number;
    label: string;
}

export interface CodeFrequencyHeatmapProps {
    heatmapData: HeatmapDay[];
    gitHubStats?: {
        currentStreak: number;
        commitsWeek: number;
    };
    locale: string;
}

export interface StatCardData {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    value: string | number;
    trend?: "up" | "down" | "stable";
    href?: string;
    color: string;
}
