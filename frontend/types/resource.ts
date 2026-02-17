export interface Resource {
    id: string;
    user_id: string;
    title: string;
    url: string;
    type: 'video' | 'article' | 'course' | 'other';
    phase_id?: string;
    image_url?: string;
    tags?: string[];
    created_at: string;
}

export type ResourceCreate = Omit<Resource, 'id' | 'created_at'>;
