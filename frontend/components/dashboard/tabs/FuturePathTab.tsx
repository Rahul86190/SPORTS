"use client";

import { RoadmapView } from "@/components/roadmap/RoadmapView";
import { User, BarChart2, Briefcase } from 'lucide-react';

interface FuturePathTabProps {
    profile: any;
    onNavigate: (tab: string) => void;
    onProfileUpdate: (profile: any) => void;
}

export function FuturePathTab({ profile, onNavigate, onProfileUpdate }: FuturePathTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900">Your Future Path</h2>
                    <p className="text-neutral-500 text-sm mt-1">AI-Driven Personalized Curriculum</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate('profile')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <User className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => onNavigate('overview')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <BarChart2 className="w-4 h-4" /> Overview
                    </button>
                    <button onClick={() => onNavigate('opportunities')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <Briefcase className="w-4 h-4" /> Opportunities
                    </button>
                </div>
            </div>

            <RoadmapView profileData={profile} onProfileUpdate={onProfileUpdate} />
        </div>
    );
}
