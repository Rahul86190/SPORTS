"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { ProfilePreview, ProfileData } from "@/components/ProfilePreview";

export default function Dashboard() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        async function fetchProfile() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error("Error fetching profile:", error);
                } else if (data) {
                    // Normalize standard columns to ProfileData structure
                    // If resume_data exists, use it as the source of truth for structured data
                    const profileData: ProfileData = data.resume_data || {
                        fullName: data.full_name || "",
                        headline: "",
                        email: user.email || "",
                        website: "",
                        github: "",
                        linkedin: "",
                        location: "",
                        skills: data.skills || [],
                        education: [],
                        experience: [],
                        projects: []
                    };
                    setProfile(profileData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        }

        if (user) {
            fetchProfile();
        }
    }, [user, authLoading, router, supabase]);

    if (authLoading || fetching) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-neutral-900 tracking-tight">SPORTS Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-neutral-500 hidden sm:inline-block">{user.email}</span>
                        <button
                            onClick={signOut}
                            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Main Profile View */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-900">Your Profile</h2>
                                <p className="text-neutral-500">This is how you appear to employers and peers.</p>
                            </div>
                            <button
                                onClick={() => router.push('/onboarding?step=1')}
                                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                            >
                                <Edit3 className="w-4 h-4" /> Edit Profile
                            </button>
                        </div>

                        {/* Reuse the ProfilePreview component */}
                        {profile ? (
                            <div className="border border-neutral-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                                {/* Pass a wrapper div to handle internal scrolling of ProfilePreview if necessary, 
                                    but ProfilePreview has its own scrollbar. We might want to remove sticky/scroll 
                                    from ProfilePreview when used here, or just wrap it. 
                                    For now, we render it directly. */}
                                <div className="[&>div]:static [&>div]:max-h-full [&>div]:border-0 [&>div]:shadow-none">
                                    <ProfilePreview data={profile} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 border-dashed">
                                <p className="text-neutral-400 mb-4">No profile data found.</p>
                                <button
                                    onClick={() => router.push('/onboarding')}
                                    className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium"
                                >
                                    Create Profile
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Stats (Placeholder for future phases) */}
                    <div className="w-full md:w-80 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                            <h3 className="font-semibold text-neutral-900 mb-2">Opportunities</h3>
                            <p className="text-sm text-neutral-500 mb-4">Find jobs and hackathons tailored to your skills.</p>
                            <button
                                onClick={() => router.push('/opportunities')}
                                className="w-full py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                            >
                                Explore Now
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                            <h3 className="font-semibold text-blue-900 mb-2">Coming Soon</h3>
                            <p className="text-sm text-blue-700/80 mb-4">
                                We are building AI-powered job matching and identifying hackathons for you.
                            </p>
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Phase 2 Loading...</span>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
