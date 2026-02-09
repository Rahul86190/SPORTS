"use client";

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, CheckCircle, Loader2, ArrowRight, Save, SkipForward, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillSelector } from '@/components/SkillSelector';
import { ProfilePreview, ProfileData } from '@/components/ProfilePreview';
import { AvatarUpload } from '@/components/AvatarUpload';

function OnboardingContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // 0 = Upload, 1 = Info, 2 = Education, 3 = Work, 4 = Projects, 5 = Skills
    const [step, setStep] = useState(0);

    useEffect(() => {
        const stepParam = searchParams.get('step');
        if (stepParam) {
            setStep(parseInt(stepParam));
        }
    }, [searchParams]);

    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    // Central Profile State
    const [profile, setProfile] = useState<ProfileData>({
        fullName: "",
        headline: "",
        email: "",
        phone: "",
        website: "",
        github: "",
        linkedin: "",
        location: "",
        skills: [],
        education: [],
        experience: [],
        projects: [],
        avatarUrl: ""
    });

    // Load user profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('resume_data')
                    .eq('id', user.id)
                    .single();

                if (data?.resume_data) {
                    // Start at step 1 (Basics) if editing, unless URL param says otherwise
                    // Note: step state is handled by another useEffect reading searchParams

                    // Merge with existing state structure to be safe
                    setProfile(prev => ({
                        ...prev,
                        ...data.resume_data
                    }));
                } else if (user.email) {
                    setProfile(prev => ({ ...prev, email: user.email! }));
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, [user, supabase]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const parseResume = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/parse-resume', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                // Merge parsed data into state
                setProfile(prev => ({
                    ...prev,
                    fullName: data.full_name || prev.fullName,
                    email: data.email || prev.email,
                    phone: data.phone || prev.phone,
                    skills: data.skills || [],
                    education: data.education || [],
                    experience: data.experience || [],
                    projects: data.projects || []
                }));
            } else {
                console.warn("Parsing failed, proceeding manually.");
            }
            setStep(1);
        } catch (err) {
            console.error(err);
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: profile.fullName,
                skills: profile.skills,
                resume_data: profile, // Save full structured object
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error(error);
            alert('Error saving profile');
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => Math.max(0, prev - 1));
    const skipStep = () => nextStep();

    // Helper to update specific fields
    const updateField = (field: keyof ProfileData, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    // Helper to add/edit array items (Education, Exp, Projects)
    const addArrayItem = (field: 'education' | 'experience' | 'projects', item: any) => {
        setProfile(prev => ({
            ...prev,
            [field]: [...prev[field], item]
        }));
    };

    const removeArrayItem = (field: 'education' | 'experience' | 'projects', index: number) => {
        setProfile(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col lg:flex-row">

            {/* LEFT SIDE: Preview (Hidden on mobile step 0) */}
            {step > 0 && (
                <div className="hidden lg:block w-1/2 p-8 bg-[#F0F0F0] border-r border-neutral-200">
                    <div className="max-w-xl mx-auto sticky top-8">
                        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Live Preview</h2>
                        <ProfilePreview data={profile} />
                    </div>
                </div>
            )}

            {/* RIGHT SIDE: Interactive Form */}
            <div className={cn("w-full transition-all p-6 lg:p-12 flex flex-col", step > 0 ? "lg:w-1/2" : "max-w-2xl mx-auto")}>

                {/* Progress Header */}
                {step > 0 && (
                    <div className="mb-8 flex items-center justify-between">
                        <button onClick={prevStep} className="text-neutral-400 hover:text-neutral-900 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={cn("h-1.5 w-8 rounded-full transition-all", step >= i ? "bg-neutral-900" : "bg-neutral-200")} />
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 0: UPLOAD */}
                {step === 0 && (
                    <div className="my-auto text-center">
                        <h1 className="text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">Build your identity.</h1>
                        <p className="text-neutral-500 mb-10 text-lg">Upload your resume to kickstart your profile, or start from scratch.</p>

                        <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-12 mb-8 hover:bg-white hover:border-neutral-300 transition-all cursor-pointer relative group bg-white/50">
                            <input type="file" accept=".docx,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <div className="flex flex-col items-center gap-4 transition-transform group-hover:scale-105">
                                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 group-hover:text-black group-hover:bg-neutral-200 transition-colors">
                                    {file ? <CheckCircle className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                                </div>
                                {file ? (
                                    <p className="font-semibold text-neutral-900 text-lg">{file.name}</p>
                                ) : (
                                    <div>
                                        <p className="font-semibold text-neutral-900 text-lg">Drop your resume here</p>
                                        <p className="text-sm text-neutral-400">Supports DOCX, TXT</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button onClick={parseResume} disabled={!file || loading} className="w-full bg-neutral-900 text-white h-14 rounded-xl font-bold text-lg hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-neutral-200 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Generate Profile with AI'}
                            </button>
                            <button onClick={() => setStep(1)} className="w-full text-neutral-500 hover:text-neutral-900 font-medium py-2 text-sm">
                                Skip Upload & Enter Manually
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 1: BASICS */}
                {step === 1 && (
                    <div className="max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-bold mb-2">The Basics</h2>
                        <p className="text-neutral-500 mb-8">Let's start with your identity.</p>

                        <div className="mb-8 flex justify-center">
                            {user && (
                                <AvatarUpload
                                    userId={user.id}
                                    currentAvatarUrl={profile.avatarUrl}
                                    onUpload={(url) => updateField('avatarUrl', url)}
                                />
                            )}
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                                <input value={profile.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="w-full p-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" placeholder="Jane Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Headline / Role</label>
                                <input value={profile.headline} onChange={(e) => updateField('headline', e.target.value)} className="w-full p-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" placeholder="Frontend Developer" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
                                    <input value={profile.location} onChange={(e) => updateField('location', e.target.value)} className="w-full p-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" placeholder="New York, NY" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Website</label>
                                    <input value={profile.website} onChange={(e) => updateField('website', e.target.value)} className="w-full p-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" placeholder="portfolio.com" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">GitHub</label>
                                    <input value={profile.github} onChange={(e) => updateField('github', e.target.value)} className="w-full p-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" placeholder="github.com/..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">LinkedIn</label>
                                    <input value={profile.linkedin} onChange={(e) => updateField('linkedin', e.target.value)} className="w-full p-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none" placeholder="linkedin.com/in/..." />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <button onClick={skipStep} className="px-6 py-3 rounded-xl border border-neutral-200 font-medium text-neutral-600 hover:bg-neutral-50 flex-1">Skip</button>
                            <button onClick={nextStep} className="px-6 py-3 rounded-xl bg-neutral-900 text-white font-bold hover:bg-black flex-[2]">Next Section <ArrowRight className="inline w-4 h-4 ml-1" /></button>
                        </div>
                    </div>
                )}

                {/* STEP 2: EDUCATION */}
                {step === 2 && (
                    <div className="max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-bold mb-2">Education</h2>
                        <p className="text-neutral-500 mb-8">Where did you learn your craft?</p>

                        {profile.education.map((edu, idx) => (
                            <div key={idx} className="p-4 bg-white border border-neutral-200 rounded-xl mb-4 relative group">
                                <button onClick={() => removeArrayItem('education', idx)} className="absolute top-2 right-2 text-neutral-300 hover:text-red-500 p-1">✕</button>
                                <h4 className="font-bold">{edu.institution}</h4>
                                <p className="text-sm text-neutral-600">{edu.degree} • {edu.year}</p>
                            </div>
                        ))}

                        {/* Simple Add Form */}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            addArrayItem('education', {
                                institution: formData.get('institution'),
                                degree: formData.get('degree'),
                                year: formData.get('year')
                            });
                            form.reset();
                        }} className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                            <input name="institution" required placeholder="School / University" className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                            <div className="flex gap-2">
                                <input name="degree" required placeholder="Degree" className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                                <input name="year" required placeholder="Year" className="w-1/3 p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                            </div>
                            <button type="submit" className="w-full py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50 text-neutral-700">+ Add Education</button>
                        </form>

                        <div className="mt-10 flex gap-4">
                            <button onClick={skipStep} className="px-6 py-3 rounded-xl border border-neutral-200 font-medium text-neutral-600 hover:bg-neutral-50 flex-1">Skip</button>
                            <button onClick={nextStep} className="px-6 py-3 rounded-xl bg-neutral-900 text-white font-bold hover:bg-black flex-[2]">Next Section <ArrowRight className="inline w-4 h-4 ml-1" /></button>
                        </div>
                    </div>
                )}

                {/* STEP 3: WORK */}
                {step === 3 && (
                    <div className="max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-bold mb-2">Experience</h2>
                        <p className="text-neutral-500 mb-8">Tell us about your professional journey.</p>

                        {profile.experience.map((exp, idx) => (
                            <div key={idx} className="p-4 bg-white border border-neutral-200 rounded-xl mb-4 relative group">
                                <button onClick={() => removeArrayItem('experience', idx)} className="absolute top-2 right-2 text-neutral-300 hover:text-red-500 p-1">✕</button>
                                <h4 className="font-bold">{exp.title}</h4>
                                <p className="text-sm text-neutral-600">{exp.company} • {exp.duration}</p>
                            </div>
                        ))}

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            addArrayItem('experience', {
                                title: formData.get('title'),
                                company: formData.get('company'),
                                duration: formData.get('duration'),
                                details: formData.get('details')
                            });
                            form.reset();
                        }} className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                            <input name="title" required placeholder="Job Title" className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                            <div className="flex gap-2">
                                <input name="company" required placeholder="Company" className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                                <input name="duration" required placeholder="Duration" className="w-1/3 p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                            </div>
                            <textarea name="details" placeholder="What did you achieve?" className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" rows={2} />
                            <button type="submit" className="w-full py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50 text-neutral-700">+ Add Position</button>
                        </form>

                        <div className="mt-10 flex gap-4">
                            <button onClick={skipStep} className="px-6 py-3 rounded-xl border border-neutral-200 font-medium text-neutral-600 hover:bg-neutral-50 flex-1">Skip</button>
                            <button onClick={nextStep} className="px-6 py-3 rounded-xl bg-neutral-900 text-white font-bold hover:bg-black flex-[2]">Next Section <ArrowRight className="inline w-4 h-4 ml-1" /></button>
                        </div>
                    </div>
                )}

                {/* STEP 4: PROJECTS */}
                {step === 4 && (
                    <div className="max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-bold mb-2">Projects</h2>
                        <p className="text-neutral-500 mb-8">Showcase your hackathons and side projects.</p>

                        {profile.projects.map((proj, idx) => (
                            <div key={idx} className="p-4 bg-white border border-neutral-200 rounded-xl mb-4 relative group">
                                <button onClick={() => removeArrayItem('projects', idx)} className="absolute top-2 right-2 text-neutral-300 hover:text-red-500 p-1">✕</button>
                                <h4 className="font-bold">{proj.name}</h4>
                                <p className="text-sm text-neutral-600 line-clamp-1">{proj.description}</p>
                            </div>
                        ))}

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            addArrayItem('projects', {
                                name: formData.get('name'),
                                link: formData.get('link'),
                                description: formData.get('description'),
                                tech_stack: (formData.get('tech') as string)?.split(',').map(s => s.trim()) || []
                            });
                            form.reset();
                        }} className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                            <input name="name" required placeholder="Project Name" className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                            <input name="link" placeholder="Link (GitHub / Demo)" className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                            <input name="tech" placeholder="Tech Stack (comma separated)" className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" />
                            <textarea name="description" placeholder="Short description..." className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm" rows={2} />
                            <button type="submit" className="w-full py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50 text-neutral-700">+ Add Project</button>
                        </form>

                        <div className="mt-10 flex gap-4">
                            <button onClick={skipStep} className="px-6 py-3 rounded-xl border border-neutral-200 font-medium text-neutral-600 hover:bg-neutral-50 flex-1">Skip</button>
                            <button onClick={nextStep} className="px-6 py-3 rounded-xl bg-neutral-900 text-white font-bold hover:bg-black flex-[2]">Next Section <ArrowRight className="inline w-4 h-4 ml-1" /></button>
                        </div>
                    </div>
                )}

                {/* STEP 5: SKILLS & FINISH */}
                {step === 5 && (
                    <div className="max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-bold mb-2">Skills & Knowledge</h2>
                        <p className="text-neutral-500 mb-8">What are your superpowers?</p>

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">My Skills</label>
                            <SkillSelector selectedSkills={profile.skills} onChange={(s) => updateField('skills', s)} />
                        </div>

                        <div className="p-6 bg-green-50 border border-green-100 rounded-2xl mb-8">
                            <h3 className="font-bold text-green-800 mb-1">You're all set!</h3>
                            <p className="text-sm text-green-700">Your profile is ready to be published. You can always edit this later.</p>
                        </div>

                        <button onClick={handleSave} disabled={loading} className="w-full bg-green-600 text-white h-14 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2 transform hover:-translate-y-0.5">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Finish & Go to Dashboard'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function Onboarding() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <OnboardingContent />
        </Suspense>
    );
}
