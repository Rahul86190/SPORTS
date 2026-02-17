"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const Navbar = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
            <nav className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-4">
                {/* Logo */}
                <Link href="/" className="font-bold text-lg tracking-tight text-neutral-900 hover:opacity-80 transition-opacity">
                    SPORTS.ai
                </Link>

                {/* Minimal CTA */}
                <div className="flex items-center gap-6">
                    <nav className="hidden md:flex gap-6 items-center">
                        <Link href="/dashboard" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">Dashboard</Link>
                        <Link href="/resources" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">Resources</Link>
                        <Link href="/opportunities" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">Opportunities</Link>
                    </nav>
                    <Link
                        href="/signup"
                        className="text-sm font-medium px-4 py-2 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all"
                    >
                        Sign up
                    </Link>
                </div>
            </nav>
        </header>
    );
};
