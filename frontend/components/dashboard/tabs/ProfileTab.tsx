"use client";

import { ProfilePreview, ProfileData } from "@/components/ProfilePreview";
import { Edit3, ArrowRight, BarChart2, Map } from 'lucide-react';
import Link from "next/link";

interface ProfileTabProps {
    profile: ProfileData;
    onNavigate: (tab: string) => void;
}

export function ProfileTab({ profile, onNavigate }: ProfileTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-neutral-900">Your Profile</h2>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate('overview')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <BarChart2 className="w-4 h-4" /> Overview
                    </button>
                    <button onClick={() => onNavigate('opportunities')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <Briefcase className="w-4 h-4" /> Opportunities
                    </button>
                    <button onClick={() => onNavigate('future-path')} className="text-sm flex items-center gap-1 text-blue-600 font-medium px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                        <Map className="w-4 h-4" /> Future Path
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <h3 className="font-medium text-neutral-900">Public Preview</h3>
                    <Link href="/onboarding?step=1" className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 px-4 py-2 rounded-lg hover:border-neutral-300 transition-all">
                        <Edit3 className="w-4 h-4" /> Edit Profile
                    </Link>
                </div>
                <div className="p-6">
                    <ProfilePreview data={profile} />
                </div>
            </div>
        </div>
    );
}

// Importing icons here to avoid 'Briefcase is not defined' error if it was missed
import { Briefcase } from 'lucide-react';
