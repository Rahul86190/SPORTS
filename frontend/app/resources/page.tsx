"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Resource } from '@/types/resource';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { LayoutDashboard, Filter, Search, Loader2 } from 'lucide-react';

export default function ResourcesPage() {
    const { user, loading: authLoading } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            fetchResources();
        } else if (!authLoading && !user) {
            setLoading(false); // No user, stop loading
        }
    }, [user, authLoading]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/resources?user_id=${user?.id}`);
            if (!res.ok) throw new Error('Failed to fetch resources');
            const data = await res.json();
            setResources(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this resource?")) return;

        try {
            const res = await fetch(`/api/resources/${id}?user_id=${user?.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setResources(prev => prev.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const filteredResources = resources.filter(res => {
        const matchesType = filterType === 'all' || res.type === filterType;
        const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (res.tags && res.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesType && matchesSearch;
    });

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <p>Please sign in to view your resources.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Resource Library</h1>
                        <p className="text-neutral-500 mt-1">Your collection of saved learning materials.</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-neutral-200 shadow-sm">
                        <div className="relative">
                            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="h-6 w-px bg-neutral-200 mx-1"></div>
                        <div className="flex gap-1">
                            {['all', 'video', 'article', 'course'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${filterType === type
                                            ? 'bg-neutral-900 text-white'
                                            : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {filteredResources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredResources.map((resource) => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
                        <LayoutDashboard className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-neutral-600">No resources found</p>
                        <p className="text-sm">Save interesting links from your roadmap to see them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
