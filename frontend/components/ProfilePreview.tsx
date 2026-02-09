"use client";

import { User2, Mail, Link as LinkIcon, Github, Linkedin, MapPin, Briefcase, GraduationCap, Code2, Award, Globe, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileData {
    fullName: string;
    headline: string;
    email: string;
    phone: string;
    website: string;
    github: string;
    linkedin: string;
    location: string;
    avatarUrl?: string;
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
        link?: string;
    }>;
}

interface ProfilePreviewProps {
    data: ProfileData;
    editable?: boolean;
    onEdit?: (step: number) => void;
}

export function ProfilePreview({ data, editable = false, onEdit }: ProfilePreviewProps) {

    const hasContent = (val: string) => val && val.trim().length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar group/preview">

            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-neutral-800 to-neutral-900 relative">
                <div className="absolute -bottom-12 left-8">
                    <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg flex items-center justify-center text-neutral-300 overflow-hidden">
                        {data.avatarUrl ? (
                            <img src={data.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User2 className="w-12 h-12" />
                        )}
                    </div>
                </div>
                {editable && onEdit && (
                    <button
                        onClick={() => onEdit(1)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all shadow-sm"
                        title="Edit Basics"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="pt-16 pb-8 px-8 space-y-8">

                {/* Identity */}
                <div className="space-y-2">
                    <h1 className={cn("text-3xl font-bold tracking-tight text-neutral-900", !hasContent(data.fullName) && "text-neutral-300 italic")}>
                        {hasContent(data.fullName) ? data.fullName : "Your Name"}
                    </h1>
                    <p className={cn("text-lg font-medium text-neutral-600", !hasContent(data.headline) && "text-neutral-300 italic")}>
                        {hasContent(data.headline) ? data.headline : "Your Headline (e.g. Software Engineer)"}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2 text-sm text-neutral-500">
                        {hasContent(data.location) && (
                            <div className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
                                <MapPin className="w-4 h-4" /> {data.location}
                            </div>
                        )}
                        {hasContent(data.email) && (
                            <div className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
                                <Mail className="w-4 h-4" /> {data.email}
                            </div>
                        )}
                        {hasContent(data.phone) && (
                            <div className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
                                <span className="text-neutral-400">📞</span> {data.phone}
                            </div>
                        )}
                        {hasContent(data.website) && (
                            <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                                <Globe className="w-4 h-4" /> Portfolio
                            </a>
                        )}
                        {hasContent(data.github) && (
                            <a href={data.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-black transition-colors">
                                <Github className="w-4 h-4" /> GitHub
                            </a>
                        )}
                        {hasContent(data.linkedin) && (
                            <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
                                <Linkedin className="w-4 h-4" /> LinkedIn
                            </a>
                        )}
                    </div>
                </div>

                <hr className="border-neutral-100" />

                {/* Skills */}
                <div className="space-y-3 group/section">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                            <Code2 className="w-4 h-4" /> Skills
                        </h3>
                        {editable && onEdit && (
                            <button onClick={() => onEdit(5)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                                <Edit3 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {data.skills && data.skills.length > 0 ? (
                            data.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-neutral-50 border border-neutral-200 rounded-full text-sm font-medium text-neutral-700">
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <span className="text-neutral-300 italic text-sm">No skills added yet...</span>
                        )}
                    </div>
                </div>

                <hr className="border-neutral-100" />

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <div className="space-y-4 group/section">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Work Experience
                            </h3>
                            {editable && onEdit && (
                                <button onClick={() => onEdit(3)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                                    <Edit3 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {data.experience.map((exp, i) => (
                                <div key={i} className="group relative border-l-2 border-neutral-100 pl-4 py-1 hover:border-neutral-300 transition-colors">
                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-neutral-200 group-hover:bg-neutral-400 transition-colors" />
                                    <h4 className="font-semibold text-neutral-900">{exp.title}</h4>
                                    <p className="text-sm text-neutral-600 mb-1">{exp.company} • {exp.duration}</p>
                                    {exp.details && <p className="text-sm text-neutral-500 line-clamp-2 hover:line-clamp-none transition-all">{exp.details}</p>}
                                </div>
                            ))}
                        </div>
                        <hr className="border-neutral-100" />
                    </div>
                )}

                {/* Projects */}
                {data.projects && data.projects.length > 0 && (
                    <div className="space-y-4 group/section">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                                <Award className="w-4 h-4" /> Projects & Hackathons
                            </h3>
                            {editable && onEdit && (
                                <button onClick={() => onEdit(4)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                                    <Edit3 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {data.projects.map((proj, i) => (
                                <div key={i} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                                    <h4 className="font-semibold text-neutral-900 flex justify-between">
                                        {proj.name}
                                        {proj.link && <a href={proj.link} target="_blank" className="text-neutral-400 hover:text-neutral-900"><LinkIcon className="w-4 h-4" /></a>}
                                    </h4>
                                    {proj.tech_stack && proj.tech_stack.length > 0 && (
                                        <div className="flex gap-1 flex-wrap mt-1 mb-2">
                                            {proj.tech_stack.map(t => <span key={t} className="text-[10px] uppercase font-bold text-neutral-500 bg-white px-1.5 py-0.5 rounded border border-neutral-200">{t}</span>)}
                                        </div>
                                    )}
                                    <p className="text-sm text-neutral-600 line-clamp-2">{proj.description}</p>
                                </div>
                            ))}
                        </div>
                        <hr className="border-neutral-100" />
                    </div>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <div className="space-y-4 group/section">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" /> Education
                            </h3>
                            {editable && onEdit && (
                                <button onClick={() => onEdit(2)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                                    <Edit3 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {data.education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-neutral-900">{edu.institution}</h4>
                                        <p className="text-sm text-neutral-600">{edu.degree}</p>
                                    </div>
                                    <span className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded text-neutral-600">{edu.year}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
