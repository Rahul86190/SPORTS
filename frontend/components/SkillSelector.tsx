"use client";

import { X, Plus } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface SkillSelectorProps {
    selectedSkills: string[];
    onChange: (skills: string[]) => void;
}

export function SkillSelector({ selectedSkills, onChange }: SkillSelectorProps) {
    const [input, setInput] = useState("");

    const handleAdd = () => {
        if (input.trim() && !selectedSkills.includes(input.trim())) {
            onChange([...selectedSkills, input.trim()]);
            setInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleRemove = (skillToRemove: string) => {
        onChange(selectedSkills.filter(skill => skill !== skillToRemove));
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200 min-h-[60px] focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-transparent transition-all">
                {selectedSkills.map((skill) => (
                    <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-neutral-200 rounded-full text-sm font-medium text-neutral-700 shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                        {skill}
                        <button
                            onClick={() => handleRemove(skill)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedSkills.length === 0 ? "Type a skill (e.g. React) and press Enter..." : "Add more..."}
                    className="flex-1 bg-transparent min-w-[150px] outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
                />
            </div>
            <p className="text-xs text-neutral-500 pl-1">Press <strong>Enter</strong> to add a skill.</p>
        </div>
    );
}
