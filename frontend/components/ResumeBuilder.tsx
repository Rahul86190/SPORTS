"use client";

import { useState, useEffect, useRef } from "react";
import {
    X, Loader2, Sparkles, Download, FileText, Briefcase, GraduationCap,
    Code2, MapPin, Mail, Phone, Link as LinkIcon, Edit3, CheckCircle2,
    RefreshCw, Github, Linkedin, Printer
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface JobDetail {
    title: string;
    company: string;
    description: string;
    requirements: string[];
    id: string;
}

interface ProfileData {
    fullName: string;
    headline: string;
    email: string;
    phone: string;
    website: string;
    github: string;
    linkedin: string;
    location: string;
    skills: string[];
    education: Array<{
        degree: string;
        institution: string;
        year: string;
    }>;
    experience: Array<{
        title: string;
        company: string;
        duration: string;
        details: string;
    }>;
    projects: Array<{
        name: string;
        tech_stack: string[];
        description: string;
    }>;
    city?: string;
    country?: string;
}

interface ResumeBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    jobDetail: JobDetail | null;
    profileData: ProfileData | null;
    savedResumeId?: string;
}

type Phase = "generating" | "editing" | "error";

const API_BASE = "http://localhost:8000/api/resume";

export default function ResumeBuilder({
    isOpen, onClose, userId, jobDetail, profileData, savedResumeId
}: ResumeBuilderProps) {
    const [phase, setPhase] = useState<Phase>("generating");
    const [resumeData, setResumeData] = useState<ProfileData | null>(null);
    const [atsScore, setAtsScore] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"summary" | "experience" | "projects" | "skills">("summary");
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    // For printing
    const printRef = useRef<HTMLDivElement>(null);

    // Generate or Fetch tailored resume on open
    useEffect(() => {
        if (!isOpen) return;
        setPhase("generating");
        setResumeData(null);
        setError(null);
        setActiveTab("summary");

        const fetchOrGenerate = async () => {
            try {
                // If opening a saved resume from the Overview Tab
                if (savedResumeId) {
                    console.log("Fetching saved resume", savedResumeId, "for user", userId);
                    const res = await fetch(`${API_BASE}/saved/${savedResumeId}?user_id=${userId}`);
                    if (!res.ok) {
                        const err = await res.json().catch(() => null);
                        console.error("Saved resume fetch failed:", res.status, err);
                        throw new Error(err?.detail || "Failed to load saved resume");
                    }

                    const data = await res.json();
                    console.log("Fetched saved resume successfully:", data);

                    // The data structure here has ats_score at the root, returning resume_data JSON object
                    setResumeData(data.resume_data);
                    setAtsScore(data.ats_score);
                    setPhase("editing");
                    return;
                }

                // Otherwise, we are doing a fresh Tailor from the Opportunities Tab
                if (!jobDetail || !profileData) {
                    throw new Error("Missing job or profile data for tailoring");
                }

                const res = await fetch(`${API_BASE}/tailor`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        job_id: jobDetail.id,
                        job_title: jobDetail.title,
                        company_name: jobDetail.company,
                        job_description: jobDetail.description || "",
                        job_requirements: jobDetail.requirements || [],
                        resume_data: profileData,
                    }),
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    throw new Error(errorData?.detail || `Failed to tailor resume (${res.status})`);
                }
                const data = await res.json();

                // Fallback to original data if AI failed to return specific arrays
                const tailored = data.resume_data;
                if (!tailored.skills) tailored.skills = profileData.skills;
                if (!tailored.experience) tailored.experience = profileData.experience;
                if (!tailored.projects) tailored.projects = profileData.projects;
                if (!tailored.education) tailored.education = profileData.education;

                setResumeData(tailored);
                setAtsScore(data.ats_score);
                setPhase("editing");
            } catch (e: any) {
                console.error("Resume Action error:", e);
                setError(e.message || "Failed to connect to server. Please try again.");
                setPhase("error");
            }
        };
        fetchOrGenerate();
    }, [isOpen, savedResumeId, userId, jobDetail, profileData]);

    // Escape to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (isOpen) window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            // @ts-ignore
            const html2pdf = (await import("html2pdf.js")).default;
            const element = printRef.current;
            if (!element) return;

            // Temporarily hide shadow to prevent it rendering in PDF
            element.classList.remove('shadow-2xl');

            const opt: any = {
                margin: 0,
                filename: `${(resumeData?.fullName || "Tailored_Resume").replace(/\s+/g, "_")}.pdf`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();

            // Restore shadow
            element.classList.add('shadow-2xl');
        } catch (e) {
            console.error("Failed to generate PDF", e);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleDownloadDocx = async () => {
        if (!resumeData) return;
        setIsDownloading(true);
        try {
            const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType } = await import("docx");

            const contactParts = [];
            if (resumeData.email) contactParts.push(resumeData.email);
            if (resumeData.phone) contactParts.push(resumeData.phone);
            if (resumeData.location || resumeData.city) contactParts.push(resumeData.location || `${resumeData.city || ""}${resumeData.country ? ", " + resumeData.country : ""}`);
            if (resumeData.linkedin) contactParts.push(resumeData.linkedin.replace('https://linkedin.com/in/', 'linkedin.com/in/').replace('https://www.linkedin.com/in/', 'linkedin.com/in/'));
            if (resumeData.github) contactParts.push(resumeData.github.replace('https://github.com/', 'github.com/'));

            const contactRuns = contactParts.flatMap((part, index) => {
                const arr = [new TextRun({ text: part, size: 18, color: "555555" })];
                if (index < contactParts.length - 1) arr.push(new TextRun({ text: "  |  ", size: 18, color: "999999" }));
                return arr;
            });

            const doc = new Document({
                styles: {
                    paragraphStyles: [
                        {
                            id: "Normal", name: "Normal", basedOn: "Normal", next: "Normal",
                            run: { font: "Arial", size: 20, color: "333333" }, // 10pt
                            paragraph: { spacing: { line: 276, before: 0, after: 0 } }, // ~1.15 line spacing
                        },
                        {
                            id: "Name", name: "Name", basedOn: "Normal",
                            run: { size: 48, bold: true, color: "111111" }, // 24pt
                            paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 } },
                        },
                        {
                            id: "ContactInfo", name: "Contact Info", basedOn: "Normal",
                            paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 } },
                        },
                        {
                            id: "SectionHeader", name: "Section Header", basedOn: "Normal",
                            run: { size: 22, bold: true, allCaps: true, color: "111111" }, // 11pt
                            paragraph: {
                                border: { bottom: { color: "111111", space: 4, style: BorderStyle.SINGLE, size: 12 } }, // 1.5pt border
                                spacing: { before: 240, after: 80 },
                            },
                        },
                        {
                            id: "ItemTitle", name: "Item Title", basedOn: "Normal",
                            run: { size: 22, bold: true, color: "111111" },
                            paragraph: {
                                spacing: { before: 120, after: 40 },
                            },
                        }
                    ],
                },
                sections: [{
                    properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
                    children: [
                        new Paragraph({ text: resumeData.fullName || "User", style: "Name" }),
                        new Paragraph({ children: contactRuns, style: "ContactInfo" }),

                        new Paragraph({ text: "PROFESSIONAL SUMMARY", style: "SectionHeader" }),
                        new Paragraph({ text: resumeData.headline || "", style: "Normal" }),

                        ...(resumeData.skills?.length ? [
                            new Paragraph({ text: "TECHNICAL SKILLS", style: "SectionHeader" }),
                            new Paragraph({ text: resumeData.skills.join(" \u2022 "), style: "Normal" })
                        ] : []),

                        ...(resumeData.experience?.length ? [
                            new Paragraph({ text: "EXPERIENCE", style: "SectionHeader" }),
                            ...resumeData.experience.flatMap(exp => [
                                new Paragraph({
                                    style: "ItemTitle",
                                    children: [
                                        new TextRun({ text: exp.title, bold: true, size: 22, color: "111111" }),
                                        new TextRun({ text: ` - ${exp.company}`, italics: true, size: 22, color: "333333" }),
                                        new TextRun({ text: `\t${exp.duration || ""}`, size: 20, italics: true, color: "555555" })
                                    ]
                                }),
                                ...(exp.details || "").split('\n').map(bullet => {
                                    const trimmed = bullet.trim().replace(/^[-*\u2022]\s*/, '');
                                    return trimmed ? new Paragraph({ text: trimmed, style: "Normal", indent: { left: 240, hanging: 240 }, bullet: { level: 0 } }) : null;
                                }).filter(Boolean) as any[]
                            ])
                        ] : []),

                        ...(resumeData.projects?.length ? [
                            new Paragraph({ text: "PROJECTS", style: "SectionHeader" }),
                            ...resumeData.projects.flatMap(proj => [
                                new Paragraph({
                                    style: "ItemTitle",
                                    children: [
                                        new TextRun({ text: proj.name, bold: true, size: 22, color: "111111" }),
                                        new TextRun({ text: proj.tech_stack?.length ? ` | ${proj.tech_stack.join(", ")}` : "", italics: true, size: 20, color: "555555" }),
                                    ]
                                }),
                                ...(proj.description || "").split('\n').map(bullet => {
                                    const trimmed = bullet.trim().replace(/^[-*\u2022]\s*/, '');
                                    return trimmed ? new Paragraph({ text: trimmed, style: "Normal", indent: { left: 240, hanging: 240 }, bullet: { level: 0 } }) : null;
                                }).filter(Boolean) as any[]
                            ])
                        ] : []),

                        ...(resumeData.education?.length ? [
                            new Paragraph({ text: "EDUCATION", style: "SectionHeader" }),
                            ...resumeData.education.flatMap(edu => [
                                new Paragraph({
                                    style: "ItemTitle",
                                    children: [
                                        new TextRun({ text: edu.institution, bold: true, size: 22, color: "111111" }),
                                        new TextRun({ text: `\t${edu.year || ""}`, italics: true, size: 20, color: "555555" })
                                    ]
                                }),
                                new Paragraph({ text: edu.degree || "", style: "Normal" }),
                            ])
                        ] : [])
                    ],
                }]
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${(resumeData.fullName || "Resume").replace(/\s+/g, "_")}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to generate DOCX", e);
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[100] animate-fadeIn print:hidden" onClick={onClose} />

            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 print:p-0 print:block print:inset-auto print:relative print:z-0" onClick={onClose}>

                {/* ─── Modal Container ─── */}
                <div
                    className={cn(
                        "bg-white rounded-2xl shadow-2xl border border-neutral-200/80 flex flex-col w-[95vw] h-[90vh] max-w-[1400px] animate-modalIn",
                        "print:w-full print:h-auto print:max-w-none print:bg-white print:border-none print:shadow-none print:rounded-none print:m-0"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ─── Header (Hidden on Print) ─── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0 print:hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-[0.08em]">
                                    {savedResumeId ? "Saved Resume" : "AI Resume Tailoring"}
                                </span>
                                {jobDetail ? (
                                    <p className="text-sm font-medium text-neutral-700 -mt-0.5">
                                        Targeting: <span className="text-neutral-900 font-bold">{jobDetail.title}</span> at {jobDetail.company}
                                    </p>
                                ) : (
                                    <p className="text-sm font-medium text-neutral-700 -mt-0.5">
                                        Viewing saved version
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {phase === "editing" && (
                                <>
                                    <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">ATS Match:</span>
                                        <span className={cn(
                                            "text-sm font-black",
                                            atsScore >= 80 ? "text-green-600" : atsScore >= 60 ? "text-amber-500" : "text-red-500"
                                        )}>{atsScore}%</span>
                                    </div>
                                    <button
                                        onClick={handleDownloadDocx}
                                        disabled={isDownloading}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        {isDownloading ? "Generating DOCX..." : "Download DOCX"}
                                    </button>
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={isDownloadingPdf}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                                        {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
                                    </button>
                                </>
                            )}
                            <button onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden relative print:overflow-visible">

                        {/* GENERATING */}
                        {phase === "generating" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 print:hidden">
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 rounded-full border-[3px] border-neutral-100 border-t-neutral-800 animate-spin" />
                                    <Sparkles className="w-5 h-5 text-neutral-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 mb-2">Tailoring Your Resume</h3>
                                <div className="space-y-2 text-center text-sm text-neutral-500 max-w-sm">
                                    <p className="flex items-center justify-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Analyzing job requirements...</p>
                                    <p className="flex items-center justify-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Rewriting bullet points with XYZ method...</p>
                                    <p className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" /> Optimizing ATS keywords...</p>
                                </div>
                            </div>
                        )}

                        {/* ERROR */}
                        {phase === "error" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 print:hidden">
                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                    <X className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 mb-2">Tailoring Failed</h3>
                                <p className="text-sm text-neutral-500 max-w-sm text-center mb-6">{error}</p>
                                <button onClick={onClose} className="px-6 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium">
                                    Close Editor
                                </button>
                            </div>
                        )}

                        {/* SPLIT LAYOUT (EDITOR + PREVIEW) */}
                        {phase === "editing" && resumeData && (
                            <div className="flex h-full print:block print:h-auto">

                                {/* ═ LEFT PANE: Editor (Hidden on Print) ═ */}
                                <div className="w-[450px] border-r border-neutral-200 bg-neutral-50 flex flex-col flex-shrink-0 print:hidden">

                                    {/* Editor Tabs */}
                                    <div className="flex items-center px-4 py-3 gap-2 overflow-x-auto border-b border-neutral-200 bg-white">
                                        {(["summary", "experience", "projects", "skills"] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
                                                    activeTab === tab
                                                        ? "bg-neutral-900 text-white"
                                                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                                                )}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Editor Content */}
                                    <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                                        {jobDetail && (
                                            <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3">
                                                <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-blue-800 leading-relaxed">
                                                    AI has optimized these sections for the <strong>{jobDetail.title}</strong> role. Review and edit any text below; changes will instantly appear on the resume preview.
                                                </p>
                                            </div>
                                        )}

                                        {activeTab === "summary" && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Professional Summary</label>
                                                    <textarea
                                                        value={resumeData.headline}
                                                        onChange={(e) => setResumeData({ ...resumeData, headline: e.target.value })}
                                                        rows={6}
                                                        className="w-full text-sm p-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none resize-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "experience" && (
                                            <div className="space-y-6">
                                                {resumeData.experience.map((exp, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-sm font-bold text-neutral-900">{exp.title}</h4>
                                                            <span className="text-xs text-neutral-500">{exp.company}</span>
                                                        </div>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Bullet Points</label>
                                                        <textarea
                                                            value={exp.details}
                                                            onChange={(e) => {
                                                                const newExp = [...resumeData.experience];
                                                                newExp[i].details = e.target.value;
                                                                setResumeData({ ...resumeData, experience: newExp });
                                                            }}
                                                            rows={8}
                                                            className="w-full text-sm p-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-neutral-900 outline-none font-mono text-xs leading-relaxed"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === "projects" && (
                                            <div className="space-y-6">
                                                {resumeData.projects.map((proj, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                                                        <h4 className="text-sm font-bold text-neutral-900 mb-3">{proj.name}</h4>
                                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">Description</label>
                                                        <textarea
                                                            value={proj.description}
                                                            onChange={(e) => {
                                                                const newProj = [...resumeData.projects];
                                                                newProj[i].description = e.target.value;
                                                                setResumeData({ ...resumeData, projects: newProj });
                                                            }}
                                                            rows={6}
                                                            className="w-full text-sm p-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-neutral-900 outline-none font-mono text-xs leading-relaxed"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === "skills" && (
                                            <div className="space-y-4">
                                                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-3">Skills List (Comma separated)</label>
                                                    <textarea
                                                        value={resumeData.skills.join(", ")}
                                                        onChange={(e) => setResumeData({
                                                            ...resumeData,
                                                            skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) as any[]
                                                        })}
                                                        rows={8}
                                                        className="w-full text-sm p-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-neutral-900 outline-none leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ═ RIGHT PANE: Live Preview ═ */}
                                <div className="flex-1 bg-neutral-200 overflow-y-auto flex justify-center items-start p-8 print:p-0 print:bg-white print:overflow-visible my-preview-container">

                                    {/* The A4 Resume Document */}
                                    <div
                                        ref={printRef}
                                        className="bg-[#ffffff] shadow-2xl print:shadow-none w-[800px] min-h-[1131px] h-max flex-shrink-0 print:w-full print:min-h-0"
                                        style={{
                                            // 800px is roughly proportional to A4 width. 1131 is A4 height ratio.
                                            padding: "48px 56px",
                                            fontFamily: "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                                            color: "#1a1a1a"
                                        }}
                                    >

                                        {/* Resume Header */}
                                        <div className="text-center mb-6">
                                            <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "Arial, sans-serif" }}>
                                                {resumeData.fullName}
                                            </h1>

                                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[#525252]">
                                                {resumeData.email && (
                                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {resumeData.email}</span>
                                                )}
                                                {resumeData.phone && (
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {resumeData.phone}</span>
                                                )}
                                                {(resumeData.location || resumeData.city) && (
                                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {resumeData.location || `${resumeData.city}, ${resumeData.country}`}</span>
                                                )}
                                                {resumeData.linkedin && (
                                                    <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {resumeData.linkedin.replace('https://linkedin.com/in/', 'linkedin.com/in/')}</span>
                                                )}
                                                {resumeData.github && (
                                                    <span className="flex items-center gap-1"><Github className="w-3 h-3" /> {resumeData.github.replace('https://github.com/', 'github.com/')}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Professional Summary */}
                                        <div className="mb-5">
                                            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#171717] border-b-2 border-[#171717] pb-1 mb-2">
                                                Professional Summary
                                            </h2>
                                            <p className="text-[12px] leading-relaxed text-[#262626]">
                                                {resumeData.headline}
                                            </p>
                                        </div>

                                        {/* Skills (Rendered in single tight paragraph for ATS density) */}
                                        {resumeData.skills && resumeData.skills.length > 0 && (
                                            <div className="mb-5">
                                                <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#171717] border-b-2 border-[#171717] pb-1 mb-2">
                                                    Technical Skills
                                                </h2>
                                                <p className="text-[12px] leading-relaxed text-[#262626]">
                                                    {/* We group all skills here. A real parser might group by Languages, etc, but a flat list is also very ATS friendly  */}
                                                    {resumeData.skills.join(" • ")}
                                                </p>
                                            </div>
                                        )}

                                        {/* Work Experience */}
                                        {resumeData.experience && resumeData.experience.length > 0 && (
                                            <div className="mb-5">
                                                <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#171717] border-b-2 border-[#171717] pb-1 mb-3">
                                                    Experience
                                                </h2>

                                                <div className="space-y-4">
                                                    {resumeData.experience.map((exp, i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between items-baseline mb-1">
                                                                <h3 className="text-[13px] font-bold text-[#171717]">{exp.title}</h3>
                                                                <span className="text-[12px] font-medium text-[#525252]">{exp.duration}</span>
                                                            </div>
                                                            <div className="text-[12px] font-semibold text-[#404040] mb-1.5 italic">
                                                                {exp.company}
                                                            </div>

                                                            <ul className="list-disc leading-relaxed text-[#262626] ml-4 space-y-1">
                                                                {exp.details.split('\n').map((bullet, j) => {
                                                                    const trimmed = bullet.trim().replace(/^[-*•]\s*/, ''); // Remove existing bullets if any
                                                                    if (!trimmed) return null;
                                                                    return (
                                                                        <li key={j} className="text-[12px] pl-1">
                                                                            {trimmed}
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Projects */}
                                        {resumeData.projects && resumeData.projects.length > 0 && (
                                            <div className="mb-5">
                                                <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#171717] border-b-2 border-[#171717] pb-1 mb-3">
                                                    Projects
                                                </h2>

                                                <div className="space-y-4">
                                                    {resumeData.projects.map((proj, i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between items-baseline mb-1">
                                                                <h3 className="text-[13px] font-bold text-[#171717]">
                                                                    {proj.name}
                                                                    {proj.tech_stack && proj.tech_stack.length > 0 && (
                                                                        <span className="font-normal text-[#737373] italic"> | {proj.tech_stack.join(", ")}</span>
                                                                    )}
                                                                </h3>
                                                            </div>

                                                            <ul className="list-disc leading-relaxed text-[#262626] ml-4 space-y-1">
                                                                {proj.description.split('\n').map((bullet, j) => {
                                                                    const trimmed = bullet.trim().replace(/^[-*•]\s*/, '');
                                                                    if (!trimmed) return null;
                                                                    return (
                                                                        <li key={j} className="text-[12px] pl-1">
                                                                            {trimmed}
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Education */}
                                        {resumeData.education && resumeData.education.length > 0 && (
                                            <div className="mb-5">
                                                <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#171717] border-b-2 border-[#171717] pb-1 mb-3">
                                                    Education
                                                </h2>

                                                <div className="space-y-3">
                                                    {resumeData.education.map((edu, i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between items-baseline">
                                                                <h3 className="text-[13px] font-bold text-[#171717]">{edu.institution}</h3>
                                                                <span className="text-[12px] font-medium text-[#525252]">{edu.year}</span>
                                                            </div>
                                                            <div className="text-[12px] text-[#262626]">
                                                                {edu.degree}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Animations and Print Styles */}
            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
                .animate-modalIn { animation: modalIn 0.2s ease-out; }

                /* PRINT CSS (Zero Dependency PDF Generation) */
                @media print {
                    @page {
                        margin: 0;
                        size: A4 portrait;
                    }
                    
                    /* Hide everything except the specific print target */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* Fix 11 blank pages issue: Override all NextJS/Tailwind wrapper heights */
                    html, body, #__next, .fixed, .absolute, .print\\:hidden {
                        height: auto !important;
                        min-height: 0 !important;
                        overflow: visible !important;
                        position: static !important;
                    }

                    /* Make the preview container the solitary visible element */
                    .my-preview-container, .my-preview-container * {
                        visibility: visible;
                    }
                    .my-preview-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        height: auto !important;
                        background: white;
                        padding: 0;
                        margin: 0;
                        /* Reset centering styles that could break print boundaries */
                        display: block !important;
                        justify-content: unset !important;
                    }
                    
                    /* Strip box shadows and borders from Document */
                    .my-preview-container > div {
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        padding: 20px 30px !important; /* Standardize print padding */
                    }
                }
            `}</style>
        </>
    );
}
