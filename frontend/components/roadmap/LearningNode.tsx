import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Circle, BookOpen } from 'lucide-react';
import { useState } from 'react';

// Custom Node for React Flow
export function LearningNode({ data }: { data: any }) {
    const [completed, setCompleted] = useState(data.completed || false);
    // Subtopics state - could be moved to parent to persist
    const [subtopicsHelper, setSubtopicsHelper] = useState(
        data.subtopics?.map((s: any) => ({ ...s, checked: false })) || []
    );

    const handleClick = () => {
        if (data.onNodeClick) {
            data.onNodeClick(data);
        }
    };

    const handleCheck = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCompleted(!completed);
        if (data.onComplete) {
            data.onComplete(data.id, !completed);
        }
    };

    const handleSubtopicCheck = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const newSubtopics = [...subtopicsHelper];
        newSubtopics[index].checked = !newSubtopics[index].checked;
        setSubtopicsHelper(newSubtopics);
    };

    // Enhanced Pastel Color Theme (Softer, Gradients)
    const getPremiumStyle = (str: string) => {
        const styles = [
            { bg: 'bg-gradient-to-br from-blue-50 to-white', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-500', hover: 'hover:shadow-blue-100' },
            { bg: 'bg-gradient-to-br from-amber-50 to-white', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-500', hover: 'hover:shadow-amber-100' },
            { bg: 'bg-gradient-to-br from-rose-50 to-white', border: 'border-rose-200', text: 'text-rose-900', icon: 'text-rose-500', hover: 'hover:shadow-rose-100' },
            { bg: 'bg-gradient-to-br from-emerald-50 to-white', border: 'border-emerald-200', text: 'text-emerald-900', icon: 'text-emerald-500', hover: 'hover:shadow-emerald-100' },
            { bg: 'bg-gradient-to-br from-violet-50 to-white', border: 'border-violet-200', text: 'text-violet-900', icon: 'text-violet-500', hover: 'hover:shadow-violet-100' },
            { bg: 'bg-gradient-to-br from-cyan-50 to-white', border: 'border-cyan-200', text: 'text-cyan-900', icon: 'text-cyan-500', hover: 'hover:shadow-cyan-100' }
        ];
        const index = str.length % styles.length;
        return styles[index];
    };

    const style = getPremiumStyle(data.title || "");

    return (
        <div
            style={{ animationDelay: `${(data.index || 0) * 0.15}s`, animationFillMode: 'both' }}
            className={`
                group relative px-6 py-6 rounded-2xl border transition-all duration-300 ease-out cursor-pointer
                ${completed ? 'bg-gradient-to-br from-green-50 to-white border-green-400 shadow-md scale-[0.98] opacity-80' : `${style.bg} ${style.border} shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1`}
                min-w-[320px] max-w-[360px] backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500
            `}
            onClick={handleClick}
        >
            {/* Top Handle (Target) - Vertical Backbone */}
            <Handle type="target" position={Position.Top} id="top" className="!bg-neutral-400 !w-3 !h-3 !border-2 !border-white" />

            {/* Target Handle (Left) - Connects from previous Main Node (Optional) */}
            {/* <Handle type="target" position={Position.Left} className="!bg-neutral-400 !w-4 !h-4 !border-4 !border-white" /> */}

            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={handleCheck} className="mt-1 transition-transform active:scale-95">
                    {completed ? (
                        <div className="bg-green-500 rounded-full p-2 shadow-sm">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                    ) : (
                        <div className={`rounded-full p-2 bg-white border ${style.border} group-hover:border-neutral-400 transition-colors`}>
                            <Circle className={`w-6 h-6 ${style.icon} opacity-80 group-hover:opacity-100`} />
                        </div>
                    )}
                </button>

                <div className="flex-1">
                    <div className={`text-xl font-bold leading-tight mb-2 ${completed ? 'text-green-800 line-through' : 'text-neutral-800'}`}>
                        {data.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        <BookOpen className="w-3 h-3" />
                        {data.time}
                    </div>
                    <div className="mt-2 text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                        {data.description}
                    </div>
                </div>
            </div>

            {/* Source Handle (Right) - Connects to Subtopic Nodes */}
            <Handle type="source" position={Position.Right} id="right" className="!bg-neutral-400 !w-4 !h-4 !border-4 !border-white" />

            {/* Bottom Handle (Source) - Vertical Backbone */}
            <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-neutral-400 !w-3 !h-3 !border-2 !border-white" />
        </div>
    );
}
