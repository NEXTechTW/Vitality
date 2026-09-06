export interface AnalyzeOptions {
    output?: string;
    breakdown?: boolean;
    window?: string;
    token?: string;
}
export declare function analyzeCommand(slug: string, options: AnalyzeOptions, spinner: {
    start: (t: string) => void;
    succeed: (t: string) => void;
    fail: (t: string) => void;
}): Promise<void>;
//# sourceMappingURL=analyze.d.ts.map