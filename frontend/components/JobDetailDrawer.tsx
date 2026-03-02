"use client";

import { useState, useEffect } from "react";
import {
    X, MapPin, Briefcase, ExternalLink, Loader2, BookmarkCheck, Bookmark,
    Beaker, FileText, CheckCircle2, AlertTriangle, Sparkles, Building2,
    ListChecks, ClipboardList
} from "lucide-react";
import PrepLab from "./PrepLab";
import ResumeBuilder from "./ResumeBuilder";
import { cn } from "@/lib/utils";

interface JobDetail {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    url: string;
    source: string;
    posted_date: string;
    type: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    eligibility: string;
    tech_stack: string[];
    about_company: string;
    application_deadline?: string;
    data_source: string;
    match_score: number;
    matched_skills: string[];
    missing_skills: string[];
}

interface JobDetailDrawerProps {
    jobId: string | null;
    userId?: string;
    isOpen: boolean;
    onClose: () => void;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
    onStartPrep: (detail: JobDetail) => void;
    onTailorResume: (detail: JobDetail) => void;
}

const API_BASE = "http://localhost:8000/api/job-detail";

export default function JobDetailDrawer({
    jobId, userId, isOpen, onClose,
    isBookmarked, onToggleBookmark,
    onStartPrep, onTailorResume,
}: JobDetailDrawerProps) {
    const [detail, setDetail] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prepJobTitle, setPrepJobTitle] = useState("");
    const [prepCompany, setPrepCompany] = useState("");

    // Add resume builder state
    const [isResumeBuilderOpen, setIsResumeBuilderOpen] = useState(false);

    useEffect(() => {
        if (!jobId || !isOpen) { setDetail(null); return; }
        const fetchDetail = async () => {
            setLoading(true); setError(null);
            try {
                const params = new URLSearchParams();
                if (userId) params.set("user_id", userId);
                const url = `${API_BASE}/${jobId}${params.toString() ? `?${params}` : ""}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to fetch job details");
                setDetail(await res.json());
            } catch (e: any) { setError(e.message || "Something went wrong"); }
            finally { setLoading(false); }
        };
        fetchDetail();
    }, [jobId, isOpen, userId]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (isOpen) window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const hasSidebar = detail && (
        (detail.tech_stack?.length > 0) ||
        (detail.matched_skills?.length > 0) ||
        (detail.missing_skills?.length > 0) ||
        (detail.eligibility && detail.eligibility.length > 10)
    );

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 animate-fadeIn" onClick={onClose} />

            {/* Centered Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
                <div
                    className="bg-white rounded-2xl shadow-2xl border border-neutral-200/80 flex flex-col w-[75vw] max-w-[1100px] min-w-[360px] animate-modalIn"
                    style={{ maxHeight: "88vh" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ─── Header ─── */}
                    <div className="flex items-center justify-between px-7 py-4 border-b border-neutral-100 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-[0.08em]">Job Details</span>
                            {detail?.data_source && (
                                <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                                    detail.data_source === "scraped"
                                        ? "bg-neutral-50 text-neutral-500 border-neutral-200"
                                        : "bg-neutral-50 text-neutral-500 border-neutral-200"
                                )}>
                                    {detail.data_source === "scraped" ? "● Live Data" : "● AI Enhanced"}
                                </span>
                            )}
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all duration-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ─── Scrollable Body ─── */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-28 gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-full border-[3px] border-neutral-100 border-t-neutral-800 animate-spin" />
                                    <Sparkles className="w-4 h-4 text-neutral-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-neutral-600">Analyzing job listing...</p>
                                    <p className="text-xs text-neutral-400 mt-1">Scraping live data & computing match score</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-28 gap-3 text-neutral-400">
                                <AlertTriangle className="w-10 h-10" />
                                <p className="text-sm">{error}</p>
                                <button onClick={onClose} className="text-xs font-medium text-neutral-600 hover:underline">Go back</button>
                            </div>
                        ) : detail ? (
                            <div className="px-7 py-6">

                                {/* ─── Title Row ─── */}
                                <div className="flex items-start justify-between gap-6 mb-6">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold text-neutral-900 leading-tight tracking-[-0.01em]">{detail.title}</h2>
                                        <p className="text-sm text-neutral-500 mt-1.5 flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> {detail.company}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md font-medium">
                                                <MapPin className="w-3 h-3" /> {detail.location || "—"}
                                            </span>
                                            {detail.salary && detail.salary !== "N/A" && (
                                                <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md">
                                                    ₹ {detail.salary}
                                                </span>
                                            )}
                                            <span className="text-[11px] font-medium bg-neutral-100 px-2.5 py-1 rounded-md text-neutral-400">
                                                {detail.source}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Match Score */}
                                    <div className={cn(
                                        "flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center border",
                                        detail.match_score >= 70 ? "border-neutral-300 bg-neutral-50 text-neutral-800" :
                                            detail.match_score >= 40 ? "border-neutral-200 bg-neutral-50 text-neutral-600" :
                                                "border-neutral-200 bg-neutral-50 text-neutral-500"
                                    )}>
                                        <span className="text-lg font-bold leading-none">{detail.match_score}%</span>
                                        <span className="text-[8px] font-bold text-neutral-400 mt-0.5 uppercase tracking-wider">Match</span>
                                    </div>
                                </div>

                                {/* ─── 2-Column Layout ─── */}
                                <div className={cn("grid gap-8", hasSidebar ? "grid-cols-1 lg:grid-cols-[1fr_280px]" : "grid-cols-1")}>

                                    {/* ═══ Left: Main Content ═══ */}
                                    <div className="space-y-7 min-w-0">

                                        {/* Description */}
                                        {detail.description && (
                                            <Section icon={<ClipboardList className="w-3.5 h-3.5" />} title="Job Description">
                                                <div className="text-[13px] text-neutral-600 leading-[1.8] whitespace-pre-line">
                                                    {detail.description}
                                                </div>
                                            </Section>
                                        )}

                                        {/* Requirements */}
                                        {detail.requirements?.length > 0 && (
                                            <Section icon={<ListChecks className="w-3.5 h-3.5" />} title="Requirements">
                                                <ul className="space-y-2.5">
                                                    {detail.requirements.map((r, i) => (
                                                        <li key={i} className="text-[13px] text-neutral-600 leading-[1.7] flex items-start gap-3">
                                                            <span className="w-5 h-5 rounded bg-neutral-100 text-neutral-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                                                {i + 1}
                                                            </span>
                                                            <span>{r}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Section>
                                        )}

                                        {/* Responsibilities */}
                                        {detail.responsibilities?.length > 0 && (
                                            <Section icon={<Briefcase className="w-3.5 h-3.5" />} title="Responsibilities">
                                                <ul className="space-y-2.5">
                                                    {detail.responsibilities.map((r, i) => (
                                                        <li key={i} className="text-[13px] text-neutral-600 leading-[1.7] flex items-start gap-3">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2 flex-shrink-0" />
                                                            <span>{r}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Section>
                                        )}

                                        {/* About Company */}
                                        {detail.about_company && (
                                            <Section icon={<Building2 className="w-3.5 h-3.5" />} title="About Company">
                                                <div className="text-[13px] text-neutral-600 leading-[1.8] whitespace-pre-line">
                                                    {detail.about_company}
                                                </div>
                                            </Section>
                                        )}
                                    </div>

                                    {/* ═══ Right: Sidebar ═══ */}
                                    {hasSidebar && (
                                        <div className="space-y-4">

                                            {/* Tech Stack */}
                                            {detail.tech_stack?.length > 0 && (
                                                <SidebarCard title="Tech Stack">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {detail.tech_stack.map((t, i) => (
                                                            <span key={i} className="text-[11px] font-medium bg-neutral-800 text-neutral-100 px-2.5 py-1 rounded-md">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </SidebarCard>
                                            )}

                                            {/* Matched Skills */}
                                            {detail.matched_skills?.length > 0 && (
                                                <SidebarCard title="Your Matching Skills" icon={<CheckCircle2 className="w-3 h-3 text-neutral-500" />}>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {detail.matched_skills.map((s, i) => (
                                                            <span key={i} className="text-[11px] font-medium bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </SidebarCard>
                                            )}

                                            {/* Missing Skills */}
                                            {detail.missing_skills?.length > 0 && (
                                                <SidebarCard title="Skills to Learn" icon={<AlertTriangle className="w-3 h-3 text-neutral-400" />}>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {detail.missing_skills.map((s, i) => (
                                                            <span key={i} className="text-[11px] font-medium bg-neutral-50 text-neutral-500 px-2 py-0.5 rounded border border-neutral-200">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </SidebarCard>
                                            )}

                                            {/* Eligibility */}
                                            {detail.eligibility && detail.eligibility.length > 10 && (
                                                <SidebarCard title="Eligibility">
                                                    <p className="text-[12px] text-neutral-500 leading-[1.7] whitespace-pre-line">
                                                        {detail.eligibility}
                                                    </p>
                                                </SidebarCard>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="h-6" />
                            </div>
                        ) : null}
                    </div>

                    {/* ─── Sticky Action Bar ─── */}
                    {detail && !loading && (
                        <div className="border-t border-neutral-100 bg-white px-7 py-3.5 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <button onClick={onToggleBookmark}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border",
                                        "hover:shadow-md hover:scale-[1.03] active:scale-[0.98]",
                                        isBookmarked
                                            ? "bg-neutral-900 text-white border-neutral-900"
                                            : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                                    )}>
                                    {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                                </button>

                                <div className="flex-1" />

                                <button onClick={() => onStartPrep(detail)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-900 hover:text-white hover:border-neutral-900 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
                                    <Beaker className="w-3.5 h-3.5" /> Start Preparation
                                </button>
                                <button onClick={() => onTailorResume(detail)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-900 hover:text-white hover:border-neutral-900 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
                                    <FileText className="w-3.5 h-3.5" /> Tailor Resume
                                </button>
                                <a href={detail.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-700 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
                                    <ExternalLink className="w-3.5 h-3.5" /> Apply Now
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Animations */}
            <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
        .animate-modalIn { animation: modalIn 0.2s ease-out; }
      `}</style>
        </>
    );
}

/* ─── Section Header ─── */
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 mb-3 flex items-center gap-1.5 pb-2 border-b border-neutral-100">
                {icon} {title}
            </h3>
            {children}
        </div>
    );
}

/* ─── Sidebar Card ─── */
function SidebarCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-400 mb-2.5 flex items-center gap-1.5">
                {icon} {title}
            </h4>
            {children}
        </div>
    );
}
