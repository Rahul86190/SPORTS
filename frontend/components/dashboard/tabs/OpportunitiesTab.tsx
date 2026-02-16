"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, RefreshCw, Briefcase, Code, MapPin, Calendar, ExternalLink, User, BarChart2, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface OpportunitiesTabProps {
    profile: any;
    onNavigate: (tab: string) => void;
}

export function OpportunitiesTab({ profile, onNavigate }: OpportunitiesTabProps) {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'internships' | 'jobs' | 'hackathons'>('internships');
    const [jobs, setJobs] = useState<any[]>([]);
    const [hackathons, setHackathons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [profile]); // Rescore when profile available

    const scoreOpportunity = (item: any, userProfile: any) => {
        if (!userProfile) return 0;
        let score = 0;

        // Location Match
        const itemLoc = (item.location || "").toLowerCase();
        const userLoc = (userProfile.location || "").toLowerCase();
        if (userLoc && itemLoc.includes(userLoc)) score += 30;
        if (itemLoc.includes("remote") || itemLoc.includes("online")) score += 20;

        // Skill Match
        if (userProfile.skills && item.tags) {
            const userSkills = Array.isArray(userProfile.skills) ? userProfile.skills : [];
            const itemTags = Array.isArray(item.tags) ? item.tags : [];
            const matches = userSkills.filter((s: string) =>
                itemTags.some((t: string) => t.toLowerCase().includes(s.toLowerCase()))
            );
            score += matches.length * 10;
        }

        return Math.min(score, 100);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Jobs
            const { data: jobsData } = await supabase
                .from('jobs')
                .select('*')
                .order('posted_at', { ascending: false });

            // Fetch Hackathons
            const { data: hackathonsData } = await supabase
                .from('hackathons')
                .select('*')
                .order('created_at', { ascending: false });

            if (jobsData) {
                const scoredJobs = jobsData.map(job => ({
                    ...job,
                    score: scoreOpportunity(job, profile)
                })).sort((a, b) => b.score - a.score);
                setJobs(scoredJobs);
            }

            if (hackathonsData) {
                const scoredHackathons = hackathonsData.map(hackathon => ({
                    ...hackathon,
                    score: scoreOpportunity(hackathon, profile)
                })).sort((a, b) => b.score - a.score);
                setHackathons(scoredHackathons);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch('/api/scrape/jobs', { method: 'POST' });
            await fetch('/api/scrape/hackathons', { method: 'POST' });
            await fetchData();
        } catch (error) {
            console.error("Error refreshing:", error);
        } finally {
            setRefreshing(false);
        }
    };

    const getTabItems = () => {
        if (activeTab === 'hackathons') return hackathons;
        if (activeTab === 'internships') return jobs.filter(j => j.type?.toLowerCase().includes('internship'));
        // Jobs tab: everything else
        return jobs.filter(j => !j.type?.toLowerCase().includes('internship'));
    };

    const renderList = () => {
        const items = getTabItems();
        const recommended = items.filter(i => i.score > 0);
        const others = items.filter(i => !i.score || i.score === 0);

        const Card = ({ item }: { item: any }) => (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg hover:border-neutral-300 transition-all group flex flex-col justify-between relative overflow-hidden h-full">
                {item.score >= 50 && <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">Perfect Match</div>}
                {item.score > 0 && item.score < 50 && <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">Good Match</div>}

                <div>
                    {/* Icon logic */}
                    {activeTab !== 'hackathons' ? (
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500 font-bold text-lg">
                                {(item.company || item.organizer || "?").substring(0, 1)}
                            </div>
                            <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md">{item.type || "Full-time"}</span>
                        </div>
                    ) : (
                        <div className="h-24 bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-lg mb-4 flex items-center justify-center text-white/20">
                            <Code className="w-10 h-10" />
                        </div>
                    )}

                    <h3 className="font-bold text-neutral-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1 text-lg">{item.title || item.name}</h3>
                    <p className="text-sm text-neutral-500 mb-4">{item.company || item.organizer}</p>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                            {activeTab !== 'hackathons' ? <MapPin className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                            {activeTab !== 'hackathons' ? (item.location || "Remote") : item.dates}
                        </div>
                        {item.salary_range && item.salary_range !== "N/A" && (
                            <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                                <span className="bg-green-50 px-2 py-0.5 rounded-md">{item.salary_range}</span>
                            </div>
                        )}
                        {item.location && activeTab === 'hackathons' && (
                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                <MapPin className="w-4 h-4" /> {item.location}
                            </div>
                        )}
                        {item.tags && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {item.tags.map((tag: string, i: number) => (
                                    <span key={i} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <a href={item.url} target="_blank" rel="noopener noreferrer" className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors mt-auto", activeTab === 'hackathons' ? "bg-neutral-900 text-white hover:bg-black" : "border border-neutral-200 hover:bg-neutral-50")}>
                    {activeTab === 'hackathons' ? "Register" : "View Details"} <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        );

        return (
            <div className="space-y-16">
                {recommended.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900">Recommended for You</h2>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                Based on {profile?.location || "skills"}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommended.map((item: any) => <Card key={item.id} item={item} />)}
                        </div>
                    </section>
                )}

                {others.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-neutral-900 mb-6 opacity-80">Other Opportunities</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                            {others.map((item: any) => <Card key={item.id} item={item} />)}
                        </div>
                    </section>
                )}

                {items.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200 border-dashed">
                        <Briefcase className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900">No opportunities found</h3>
                        <p className="text-neutral-500 mb-6">Try refreshing the data to fetch new roles.</p>
                        <button onClick={handleRefresh} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium">Refresh Data</button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-neutral-900">Opportunities</h2>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate('profile')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <User className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => onNavigate('overview')} className="text-sm flex items-center gap-1 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
                        <BarChart2 className="w-4 h-4" /> Overview
                    </button>
                    <button onClick={() => onNavigate('future-path')} className="text-sm flex items-center gap-1 text-blue-600 font-medium px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                        <Map className="w-4 h-4" /> Future Path
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-neutral-200">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('internships')}
                        className={cn("text-sm font-medium transition-colors hover:text-neutral-900", activeTab === 'internships' ? "text-neutral-900 font-bold" : "text-neutral-500")}
                    >
                        Internships
                    </button>
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={cn("text-sm font-medium transition-colors hover:text-neutral-900", activeTab === 'jobs' ? "text-neutral-900 font-bold" : "text-neutral-500")}
                    >
                        Jobs
                    </button>
                    <button
                        onClick={() => setActiveTab('hackathons')}
                        className={cn("text-sm font-medium transition-colors hover:text-neutral-900", activeTab === 'hackathons' ? "text-neutral-900 font-bold" : "text-neutral-500")}
                    >
                        Hackathons
                    </button>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-70"
                >
                    <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
                </div>
            ) : (
                renderList()
            )}
        </div>
    );
}
