import { Resource } from '@/types/resource';
import { Trash2, ExternalLink, Video, FileText, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceCardProps {
    resource: Resource;
    onDelete: (id: string) => void;
}

export function ResourceCard({ resource, onDelete }: ResourceCardProps) {
    const Icon = resource.type === 'video' ? Video :
        resource.type === 'article' ? FileText :
            resource.type === 'course' ? BookOpen : ExternalLink;

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow group relative flex flex-col h-full">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                    <Icon className="w-5 h-5" />
                </div>
                <button
                    onClick={() => onDelete(resource.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Resource"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <h3 className="font-semibold text-neutral-900 line-clamp-2 mb-1 flex-1" title={resource.title}>
                {resource.title}
            </h3>

            <div className="text-xs text-neutral-500 mb-4 line-clamp-1">
                {new URL(resource.url).hostname.replace('www.', '')}
            </div>

            <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    {resource.type}
                </span>
                <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    Visit <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
}
