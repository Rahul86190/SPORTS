"use client";

import { CheckCircle2, Circle } from "lucide-react";

export function GoalProgress({ profile }: { profile: any }) {
    const goals = [
        { id: 1, title: "Complete Profile", completed: true },
        { id: 2, title: "Verify 3 Skills", completed: (profile?.skills?.length || 0) >= 3 },
        { id: 3, title: "Apply to 5 Jobs", completed: false }, // Mock
        { id: 4, title: "Upload Resume", completed: !!profile?.resume_url },
    ];

    const completedCount = goals.filter(g => g.completed).length;
    const progress = (completedCount / goals.length) * 100;

    return (
        <div className="bg-white p-6 rounded-xl border border-neutral-200">
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold text-neutral-900">Your Goals</h3>
                <span className="text-xl font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>

            <div className="w-full bg-neutral-100 rounded-full h-2 mb-6">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="space-y-4">
                {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3">
                        {goal.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                            <Circle className="w-5 h-5 text-neutral-300 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${goal.completed ? "text-neutral-900 font-medium line-through opacity-70" : "text-neutral-600"}`}>
                            {goal.title}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
