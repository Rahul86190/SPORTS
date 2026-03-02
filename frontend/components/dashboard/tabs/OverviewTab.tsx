"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Analytics } from "@/components/dashboard/Analytics";
import { GoalProgress } from "@/components/dashboard/GoalProgress";
import { ArrowRight, User, Briefcase, Map, Clock, Trophy, Loader2, Hash, FileText, Sparkles } from 'lucide-react';
import ResumeBuilder from "@/components/ResumeBuilder";

interface OverviewTabProps {
    profile: any;
    onNavigate: (tab: string) => void;
}

interface PrepSession {
    id: string;
    job_title: string;
    company_name: string;
    score: number;
    grade: string;
    total_questions: number;
    correct: number;
    wrong: number;
    skipped: number;
    time_taken: number;
    started_at: string;
    completed_at: string | null;
}

interface TailoredResume {
    id: string;
    job_title: string;
    ats_score: number;
    created_at: string;
}

const API_BASE = "http://localhost:8000/api/prep";
const RESUME_API_BASE = "http://localhost:8000/api/resume";

export function OverviewTab({ profile, onNavigate }: OverviewTabProps) {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<PrepSession[]>([]);
    const [resumes, setResumes] = useState<TailoredResume[]>([]);
    const [loadingPrep, setLoadingPrep] = useState(true);
    const [loadingResumes, setLoadingResumes] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>("");
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            try {
                setLoadingPrep(true);
                const res = await fetch(`${API_BASE}/history?user_id=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data.sessions || []);
                } else {
                    console.error("Prep history fetch failed:", res.status);
                }
            } catch (e) {
                console.error("Network error fetching prep history:", e);
            }
            finally { setLoadingPrep(false); }

            try {
                setLoadingResumes(true);
                setDebugInfo("Fetching...");
                const res = await fetch(`${RESUME_API_BASE}/history?user_id=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setDebugInfo(`OK, items: ${data?.length}, type: ${typeof data}`);
                    setResumes(data || []);
                } else {
                    setDebugInfo(`Fail: ${res.status}`);
                    console.error("Resume history fetch failed:", res.status);
                }
            } catch (e: any) {
                setDebugInfo(`Error: ${e.message}`);
                console.error("Network error fetching resume history:", e);
            }
            finally { setLoadingResumes(false); }
        };
        fetchHistory();
    }, [user]);

    const formatTime = (seconds: number) => {
        if (!seconds) return "—";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const formatDate = (iso: string) => {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
            " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

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

            {/* ─── Prep History ─── */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-neutral-900">Interview Prep History</h3>
                            <p className="text-xs text-neutral-400">Your quiz scores across job preparations</p>
                        </div>
                    </div>
                    {sessions.length > 0 && (
                        <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-md">
                            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {loadingPrep ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-12">
                        <Trophy className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                        <p className="text-sm text-neutral-400 mb-1">No prep sessions yet</p>
                        <p className="text-xs text-neutral-300">
                            Go to <button onClick={() => onNavigate('opportunities')} className="text-neutral-600 underline hover:text-neutral-900">Opportunities</button> and click "Start Preparation" on any job
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3 pr-4">Job</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3 pr-4">Company</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3 pr-4">Started</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3 pr-4">Completed</th>
                                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3 pr-2">Score</th>
                                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3 pr-2">Total</th>
                                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3 pr-2">Correct</th>
                                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3 pr-2">Wrong</th>
                                    <th className="text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 pb-3">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s) => (
                                    <tr key={s.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                                        <td className="py-3 pr-4">
                                            <span className="text-sm font-medium text-neutral-800 block truncate max-w-[200px]">
                                                {s.job_title}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="text-xs text-neutral-500 block truncate max-w-[140px]">
                                                {s.company_name}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="text-xs text-neutral-400 whitespace-nowrap">
                                                {formatDate(s.started_at)}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className="text-xs text-neutral-400 whitespace-nowrap">
                                                {s.completed_at ? formatDate(s.completed_at) : "In progress"}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-2 text-center">
                                            <span className={`text-sm font-bold ${s.score >= 70 ? "text-neutral-900" : s.score >= 50 ? "text-neutral-600" : "text-neutral-400"}`}>
                                                {s.score}%
                                            </span>
                                        </td>
                                        <td className="py-3 pr-2 text-center">
                                            <span className="text-xs text-neutral-500 tabular-nums">{s.total_questions}</span>
                                        </td>
                                        <td className="py-3 pr-2 text-center">
                                            <span className="text-xs font-medium text-neutral-700 tabular-nums">{s.correct}</span>
                                        </td>
                                        <td className="py-3 pr-2 text-center">
                                            <span className="text-xs text-neutral-400 tabular-nums">{s.wrong}</span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-xs text-neutral-400 whitespace-nowrap">
                                                {formatTime(s.time_taken)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── Tailored Resumes History ─── */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-neutral-900">
                                Tailored Resumes
                                <span className="ml-2 text-xs text-red-500 font-normal">[{debugInfo}]</span>
                            </h3>
                            <p className="text-xs text-neutral-400">Your AI-optimized resumes for specific roles</p>
                        </div>
                    </div>
                    {resumes.length > 0 && (
                        <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-md">
                            {resumes.length} item{resumes.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {loadingResumes ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                        <p className="text-sm text-neutral-400 mb-1">No tailored resumes yet</p>
                        <p className="text-xs text-neutral-300">
                            Go to <button onClick={() => onNavigate('opportunities')} className="text-neutral-600 underline hover:text-neutral-900">Opportunities</button>, open a job and click "Tailor Resume"
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {resumes.map((r) => (
                            <div
                                key={r.id}
                                onClick={() => setSelectedResumeId(r.id)}
                                className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:shadow-md cursor-pointer transition-all"
                            >
                                <p className="text-xs text-neutral-500 mb-1">{formatDate(r.created_at)}</p>
                                <h4 className="font-bold text-neutral-900 text-sm mb-3 line-clamp-1" title={r.job_title}>
                                    {r.job_title}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-neutral-200 rounded-md">
                                        <Sparkles className="w-3 h-3 text-blue-500" />
                                        <span className="text-[10px] font-bold text-neutral-600 uppercase">ATS Score</span>
                                        <span className="text-xs font-black text-neutral-900 pl-1 border-l border-neutral-200">{r.ats_score}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedResumeId && (
                <ResumeBuilder
                    isOpen={!!selectedResumeId}
                    onClose={() => setSelectedResumeId(null)}
                    userId={user?.id || ""}
                    jobDetail={null}
                    profileData={null}
                    savedResumeId={selectedResumeId}
                />
            )}
        </div>
    );
}
