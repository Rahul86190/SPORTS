import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';

export function SubtopicNode({ data }: { data: any }) {
    const [completed, setCompleted] = useState(data.completed || false);

    const toggleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCompleted(!completed);
        if (data.onComplete) {
            data.onComplete(data.id, !completed);
        }
    };

    return (
        <div
            className={`
                group flex items-center gap-3 px-4 py-2 bg-white border rounded-full shadow-sm hover:shadow-md transition-all min-w-[220px] max-w-[260px] cursor-pointer
                ${completed ? 'border-green-400 opacity-75' : 'border-neutral-200 hover:border-blue-300'}
            `}
            onClick={toggleComplete}
        >
            <Handle type="target" position={Position.Left} className="!bg-neutral-300 !w-2 !h-2" />

            <div className="flex-shrink-0">
                {completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                    <Circle className="w-5 h-5 text-neutral-300 group-hover:text-blue-400 transition-colors" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                    {data.title}
                </div>
                <div className="text-[10px] text-neutral-400 font-medium">
                    {data.time}
                </div>
            </div>

            {/* No source handle needed for leaf nodes usually, but adding for extensibility */}
            {/* <Handle type="source" position={Position.Right} className="!bg-neutral-300 !w-2 !h-2" /> */}
        </div>
    );
}
