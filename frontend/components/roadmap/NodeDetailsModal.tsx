import { X, ExternalLink, CheckCircle2, Circle, Clock, Target, BookOpen } from 'lucide-react';

export interface Resource {
    title: string;
    url: string;
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
}

export function NodeDetailsModal({ isOpen, onClose, node, onComplete }: NodeDetailsModalProps) {
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
                                {node.resources.map((res, idx) => (
                                    <li key={idx}>
                                        <a
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-all p-2 rounded-lg hover:bg-neutral-50"
                                        >
                                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                            <span>{res.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer / Action */}
                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end">
                    {/* Maybe a big completion button here? For now, close is fine. */}
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
