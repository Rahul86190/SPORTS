"use client";

import { Analytics } from "@/components/dashboard/Analytics";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { ArrowRight, User, Briefcase, Map } from 'lucide-react';

interface OverviewTabProps {
    profile: any;
    onNavigate: (tab: string) => void;
}

export function OverviewTab({ profile, onNavigate }: OverviewTabProps) {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-neutral-900">Overview</h2>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate('profile')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <User className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => onNavigate('opportunities')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <Briefcase className="w-4 h-4" /> Opportunities
                    </button>
                    <button onClick={() => onNavigate('future-path')} className="text-sm flex items-center gap-1 text-blue-600 font-medium px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                        <Map className="w-4 h-4" /> Future Path
                    </button>
                </div>
            </div>

            <Analytics profile={profile} />

            <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <h3 className="font-bold text-lg mb-4">Current Goals</h3>
                <GoalProgress profile={profile} />
            </div>
        </div>
    );
}
