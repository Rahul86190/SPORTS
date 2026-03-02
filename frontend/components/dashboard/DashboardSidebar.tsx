"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { User, LayoutDashboard, Briefcase, Map, Bookmark, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface DashboardSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'future-path', label: 'Future Path', icon: Map },
    { id: 'resources', label: 'Resources', icon: Bookmark },
];

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
    const { signOut } = useAuth();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleTabClick = (tabId: string) => {
        router.push(`/dashboard?tab=${tabId}`);
        onTabChange(tabId);
        setMobileMenuOpen(false);
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 fixed h-full z-20">
                <div className="p-6 border-b border-neutral-100">
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">SPORTS</h1>
                    <p className="text-xs text-neutral-500 mt-1">Student Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                ? 'bg-neutral-900 text-white shadow-md'
                                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-neutral-100">
                    <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full bg-white border-b border-neutral-200 z-30 px-4 h-16 flex items-center justify-between">
                <h1 className="text-xl font-bold text-neutral-900">SPORTS</h1>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute right-0 top-0 h-full w-64 bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <nav className="space-y-4 mt-12">
                            {NAV_ITEMS.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabClick(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium ${activeTab === item.id ? 'bg-neutral-900 text-white' : 'text-neutral-600'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}
                            <button
                                onClick={signOut}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
