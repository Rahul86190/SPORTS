export interface RoadmapResource {
    title: string;
    url: string;
}

export interface RoadmapNode {
    id: string;
    title: string;
    estimated_time: string;
    description: string;
    specific_focus: string;
    subtopics?: { title: string; time: string; checked?: boolean }[];
    resources: RoadmapResource[];
    status?: 'pending' | 'completed'; // For UI state
}

export interface RoadmapPhase {
    id: string;
    title: string;
    estimated_time: string;
    description: string;
    nodes: RoadmapNode[];
}

export interface RoadmapData {
    title: string;
    description: string;
    phases: RoadmapPhase[];
}
