export interface Opportunity {
    id: string;
    title: string;
    company: string;
    location: string;
    url: string;
    source: string;
    type: string; // "job" | "internship" | "program" | "hackathon"
    country: string;
    is_remote: boolean;
    is_international?: boolean;
    is_fully_funded?: boolean;
    description: string;
    tags: string[];
    posted_date: string;
    salary?: string | null;
    deadline?: string;
    stipend?: string;
    duration?: string;
    match_score: number;
}

export interface FilterState {
    category: string; // "all" | "job" | "internship" | "program" | "hackathon"
    remote: boolean;
    international: boolean;
    source: string; // "all" | specific source name
    search: string;
}

export interface OpportunitySearchResponse {
    opportunities: Opportunity[];
    total: number;
    cached: boolean;
    source_breakdown: Record<string, number>;
}
