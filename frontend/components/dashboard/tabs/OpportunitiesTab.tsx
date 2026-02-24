"use client";

import {
    Briefcase, GraduationCap, Zap, ArrowRight, Globe,
    TrendingUp, Target, Users, Award, Sparkles,
    Code, Building2, BookOpen, Trophy, Laptop,
    MapPin, FileText, Search as SearchIcon
} from 'lucide-react';
import Link from 'next/link';

interface OpportunitiesTabProps {
    profile: any;
    onNavigate: (tab: string) => void;
}

const INDIA_SOURCES = [
    { name: "Internshala", desc: "India's largest internship platform", icon: GraduationCap, types: "Internships · Jobs" },
    { name: "LinkedIn India", desc: "Professional listings for Indian market", icon: Building2, types: "Jobs · Internships" },
    { name: "Unstop", desc: "Competitions, quizzes & hiring challenges", icon: Trophy, types: "Hackathons · Jobs" },
    { name: "AICTE", desc: "Govt-approved internship schemes", icon: FileText, types: "Internships" },
    { name: "VikashPR (GitHub)", desc: "Curated India-focused tech listings", icon: Code, types: "Internships · Jobs" },
    { name: "HackerEarth", desc: "Coding challenges & hiring sprints", icon: Laptop, types: "Hackathons" },
];

const GLOBAL_SOURCES = [
    { name: "LinkedIn", desc: "World's largest professional network", icon: Building2, types: "Jobs · Internships" },
    { name: "Adzuna", desc: "Global job search across 16+ countries", icon: Globe, types: "Jobs" },
    { name: "JSearch (RapidAPI)", desc: "Aggregated listings from Google Jobs", icon: SearchIcon, types: "Jobs · Internships" },
    { name: "Remotive", desc: "Remote-first tech positions worldwide", icon: Laptop, types: "Remote Jobs" },
    { name: "Arbeitnow", desc: "European & global remote job board", icon: Globe, types: "Remote Jobs" },
    { name: "MLH", desc: "Major League Hacking — student hackathons", icon: Trophy, types: "Hackathons" },
    { name: "HackerEarth", desc: "Global coding challenges & sprints", icon: Code, types: "Hackathons" },
    { name: "Unstop", desc: "International competitions & challenges", icon: Zap, types: "Hackathons · Jobs" },
];

export function OpportunitiesTab({ profile, onNavigate }: OpportunitiesTabProps) {
    return (
        <div className="space-y-8">
            {/* ─── Hero ─── */}
            <div className="relative overflow-hidden bg-neutral-900 rounded-2xl p-8 md:p-10">
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                <div className="relative">
                    <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4">
                        <Sparkles className="w-3 h-3" /> Aggregated from 10+ platforms
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Your Gateway to<br />
                        <span className="text-neutral-400">Opportunities</span>
                    </h1>
                    <p className="text-neutral-400 text-sm md:text-base mt-3 max-w-lg leading-relaxed">
                        SPORTS brings together internships, jobs, and hackathons from across the web — tailored to your location, skills, and career goals.
                    </p>
                    <Link href="/opportunities"
                        className="inline-flex items-center gap-2 mt-6 bg-white text-neutral-900 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-neutral-100 transition-colors">
                        Explore Opportunities <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* ─── Why Opportunities Matter ─── */}
            <div>
                <h2 className="text-lg font-bold text-neutral-900 mb-4">Why Opportunities Matter</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { icon: TrendingUp, title: "Build Real-World Experience", desc: "Bridge the gap between academics and industry with hands-on internships and projects." },
                        { icon: Target, title: "Discover Your Career Path", desc: "Explore different domains — from tech to design to research — before committing to one." },
                        { icon: Users, title: "Grow Your Network", desc: "Connect with mentors, peers, and industry professionals through hackathons and programs." },
                        { icon: Award, title: "Stand Out to Recruiters", desc: "A strong portfolio of internships and competitions makes your resume shine." },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-neutral-200">
                            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                <item.icon className="w-4 h-4 text-neutral-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-900">{item.title}</h3>
                                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Sources: For Indian Students ─── */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-neutral-500" />
                    <h2 className="text-lg font-bold text-neutral-900">For Indian Students</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {INDIA_SOURCES.map((src, i) => (
                        <SourceCard key={i} src={src} />
                    ))}
                </div>
            </div>

            {/* ─── Sources: For US & International Students ─── */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-neutral-500" />
                    <h2 className="text-lg font-bold text-neutral-900">For US & International Students</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GLOBAL_SOURCES.map((src, i) => (
                        <SourceCard key={i} src={src} />
                    ))}
                </div>
            </div>

            {/* ─── How It Works ─── */}
            <div>
                <h2 className="text-lg font-bold text-neutral-900 mb-4">How It Works</h2>
                <div className="flex flex-col">
                    {[
                        { step: "1", title: "Complete Your Profile", desc: "Add your skills, goals, and location so we can personalize results." },
                        { step: "2", title: "Browse Opportunities", desc: "Filter by type, location, source, and stipend across all platforms." },
                        { step: "3", title: "Apply with One Click", desc: "Each listing links directly to the application page — no intermediaries." },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4 px-4 py-3">
                            <div className="flex flex-col items-center">
                                <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {item.step}
                                </div>
                                {i < 2 && <div className="w-px flex-1 bg-neutral-200 mt-2" />}
                            </div>
                            <div className="pb-2">
                                <h3 className="text-sm font-semibold text-neutral-900">{item.title}</h3>
                                <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── CTA ─── */}
            <div className="bg-neutral-50 rounded-2xl p-6 text-center border border-neutral-200">
                <h3 className="font-bold text-neutral-900">Ready to explore?</h3>
                <p className="text-sm text-neutral-500 mt-1">Find internships, jobs, and hackathons curated for you.</p>
                <Link href="/opportunities"
                    className="inline-flex items-center gap-2 mt-4 bg-neutral-900 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-neutral-800 transition-colors">
                    See All Opportunities <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

/* ─── Source Card ─── */
function SourceCard({ src }: { src: { name: string; desc: string; icon: any; types: string } }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <src.icon className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-800">{src.name}</p>
                <p className="text-[11px] text-neutral-400 truncate">{src.desc}</p>
            </div>
            <span className="text-[9px] font-medium text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded flex-shrink-0">
                {src.types}
            </span>
        </div>
    );
}
