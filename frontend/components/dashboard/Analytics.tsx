"use client";

import {
    RadialBarChart,
    RadialBar,
    Legend,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

export function Analytics({ profile }: { profile: any }) {
    // Mock Data for "Application Velocity"
    const activityData = [
        { name: "Mon", applications: 2 },
        { name: "Tue", applications: 5 },
        { name: "Wed", applications: 3 },
        { name: "Thu", applications: 8 },
        { name: "Fri", applications: 4 },
        { name: "Sat", applications: 1 },
        { name: "Sun", applications: 0 },
    ];

    // Dynamic Skills Data
    const userSkills = profile?.skills || [];
    const skillsData = userSkills.slice(0, 6).map((skill: string) => ({
        subject: skill,
        A: 80 + Math.random() * 20, // Mock "Market Demand"
        fullMark: 150,
    }));

    // Profile Strength (based on completeness)
    const strengthScore = calculateProfileStrength(profile);
    const strengthData = [
        {
            name: "Profile Strength",
            uv: strengthScore,
            fill: "#10b981", // Emerald-500
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Strength */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Profile Strength</h3>
                <div className="h-64 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={strengthData}>
                            <RadialBar
                                // minAngle={15}
                                background
                                dataKey="uv"
                                cornerRadius={10}
                            />
                            {/* <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={style} /> */}
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-neutral-900">{strengthScore}%</span>
                        <span className="text-xs text-neutral-500">Complete</span>
                    </div>
                </div>
            </div>

            {/* Skills Radar */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 hidden md:block">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Skill Assessment</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                            <PolarGrid stroke="#e5e5e5" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#525252", fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar
                                name="Market Value"
                                dataKey="A"
                                stroke="#2563eb"
                                fill="#3b82f6"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Activity Chart */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 lg:col-span-1 md:col-span-2">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Activity</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#a3a3a3", fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a3a3a3", fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ stroke: '#e5e5e5', strokeWidth: 1 }}
                            />
                            <Line type="monotone" dataKey="applications" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function calculateProfileStrength(profile: any) {
    if (!profile) return 0;
    let score = 0;
    if (profile.full_name) score += 20;
    if (profile.skills && profile.skills.length > 0) score += 20;
    if (profile.bio) score += 10;
    if (profile.experience && profile.experience.length > 0) score += 20;
    if (profile.education && profile.education.length > 0) score += 20;
    if (profile.avatar_url) score += 10;
    return Math.min(score, 100);
}
