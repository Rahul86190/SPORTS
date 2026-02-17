import { X, ExternalLink, CheckCircle2, Circle, Clock, Target, BookOpen, Sparkles, BookmarkPlus, Check } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useState } from 'react';

export interface Resource {
    title: string;
    url: string;
    type?: string;
}

export interface NodeDetails {
    id: string;
    title: string;
    description: string;
    time: string;
    subtopics?: { title: string; time: string; checked?: boolean }[];
    specific_focus?: string;
    resources?: Resource[];
    completed?: boolean;
}

interface NodeDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    node: NodeDetails | null;
    onComplete?: (id: string, status: boolean) => void;
    onAskTutor?: (context: string) => void;
}

export function NodeDetailsModal({ isOpen, onClose, node, onComplete, onAskTutor }: NodeDetailsModalProps) {
    const { user } = useAuth();
    const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set());
    const [savingUrl, setSavingUrl] = useState<string | null>(null);

    const handleSaveResource = async (res: Resource) => {
        if (!user || !node) return;
        setSavingUrl(res.url);

        try {
            const response = await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    title: res.title,
                    url: res.url,
                    type: res.type || 'article', // Default if missing
                    phase_id: node.id, // Link to node as phase_id for now
                    tags: [node.title]
                })
            });

            if (response.ok) {
                setSavedUrls(prev => new Set(prev).add(res.url));
            }
        } catch (error) {
            console.error("Failed to save resource", error);
        } finally {
            setSavingUrl(null);
        }
    };

    if (!isOpen || !node) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-neutral-900 p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-white pr-8">{node.title}</h2>
                        <div className="flex items-center gap-2 text-neutral-400 text-sm mt-1">
                            <Clock className="w-4 h-4" />
                            <span>{node.time}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tutor Context Bar */}
                <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-center sm:justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Tutor Available
                    </span>
                    <button
                        onClick={() => onAskTutor?.(node.title + ": " + node.description)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline bg-white/50 px-2 py-1 rounded border border-blue-100 hover:bg-white transition-colors"
                    >
                        Ask about this topic
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Objective */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" /> Objective
                        </h3>
                        <p className="text-neutral-700 leading-relaxed">{node.description}</p>
                    </div>

                    {/* Subtopics / Checklist */}
                    {node.subtopics && node.subtopics.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Key Topics
                            </h3>
                            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2">
                                {node.subtopics.map((sub, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-neutral-800">{sub.title}</span>
                                        <span className="text-xs text-neutral-500 bg-white px-2 py-1 rounded border border-neutral-100">{sub.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Specific Focus */}
                    {node.specific_focus && (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                            <h3 className="text-sm font-bold text-blue-800 mb-2">💡 Specific Focus</h3>
                            <p className="text-sm text-blue-700">{node.specific_focus}</p>
                        </div>
                    )}

                    {/* Resources */}
                    {node.resources && node.resources.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Top Resources
                            </h3>
                            <ul className="space-y-2">
                                {node.resources.map((res, idx) => {
                                    const isSaved = savedUrls.has(res.url);
                                    const isSaving = savingUrl === res.url;

                                    return (
                                        <li key={idx} className="flex items-center gap-2 group">
                                            <a
                                                href={res.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-all p-2 rounded-lg hover:bg-neutral-50"
                                            >
                                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                                <span>{res.title}</span>
                                            </a>
                                            <button
                                                onClick={() => handleSaveResource(res)}
                                                disabled={isSaved || isSaving}
                                                className={`p-2 rounded-md transition-all ${isSaved
                                                        ? 'text-green-600 bg-green-50'
                                                        : 'text-neutral-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100'
                                                    }`}
                                                title={isSaved ? "Saved" : "Save to Resources"}
                                            >
                                                {isSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer / Action */}
                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
