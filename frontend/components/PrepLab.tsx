"use client";

import { useState, useEffect, useCallback } from "react";
import {
    X, Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
    Sparkles, Clock, Hash, Code2, MessageSquare, CircleDot,
    Trophy, ArrowRight, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface Question {
    index: number;
    type: "mcq" | "short_answer" | "coding";
    question: string;
    options?: string[];
    topic: string;
    difficulty: string;
}

interface FeedbackItem {
    index: number;
    type: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    skipped: boolean;
    feedback?: string;
    topic: string;
}

interface QuizResult {
    session_id: string;
    score: number;
    grade: string;
    total: number;
    correct: number;
    wrong: number;
    skipped: number;
    feedback: FeedbackItem[];
}

interface PrepLabProps {
    isOpen: boolean;
    onClose: () => void;
    jobTitle: string;
    company: string;
    jobId: string;
    userId: string;
    techStack: string[];
    requirements: string[];
    responsibilities: string[];
}

type Phase = "generating" | "quiz" | "submitting" | "results";

const API_BASE = "http://127.0.0.1:8000/api/prep";

export default function PrepLab({
    isOpen, onClose, jobTitle, company, jobId, userId,
    techStack, requirements, responsibilities,
}: PrepLabProps) {
    const [phase, setPhase] = useState<Phase>("generating");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sessionId, setSessionId] = useState<string>("");
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [result, setResult] = useState<QuizResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number>(0);
    const [reviewIndex, setReviewIndex] = useState<number | null>(null);

    // Generate quiz on open
    useEffect(() => {
        if (!isOpen) return;
        setPhase("generating");
        setQuestions([]);
        setAnswers({});
        setCurrentQ(0);
        setResult(null);
        setError(null);
        setReviewIndex(null);

        const generate = async () => {
            try {
                const res = await fetch(`${API_BASE}/generate-quiz`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        job_id: jobId,
                        job_title: jobTitle,
                        company,
                        tech_stack: techStack,
                        requirements,
                        responsibilities,
                    }),
                });
                if (!res.ok) throw new Error("Failed to generate quiz");
                const data = await res.json();
                setQuestions(data.questions || []);
                setSessionId(data.session_id);
                setStartTime(Date.now());
                setPhase("quiz");
            } catch (e: any) {
                setError(e.message);
            }
        };
        generate();
    }, [isOpen]);

    // Submit quiz
    const handleSubmit = useCallback(async () => {
        setPhase("submitting");
        try {
            const answerList = Object.entries(answers).map(([idx, ans]) => ({
                question_index: parseInt(idx),
                answer: ans,
            }));
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);

            const res = await fetch(`${API_BASE}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    answers: answerList,
                    time_taken: timeTaken,
                }),
            });
            if (!res.ok) throw new Error("Failed to submit quiz");
            const data = await res.json();
            setResult(data);
            setPhase("results");
        } catch (e: any) {
            setError(e.message);
            setPhase("quiz");
        }
    }, [answers, sessionId, startTime]);

    // Escape to close
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (isOpen) window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const q = questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

    const typeIcon = (type: string) => {
        if (type === "mcq") return <CircleDot className="w-3.5 h-3.5" />;
        if (type === "coding") return <Code2 className="w-3.5 h-3.5" />;
        return <MessageSquare className="w-3.5 h-3.5" />;
    };

    const typeLabel = (type: string) => {
        if (type === "mcq") return "Multiple Choice";
        if (type === "coding") return "Coding";
        return "Short Answer";
    };

    const diffColor = (d: string) => {
        if (d === "easy") return "text-neutral-500 bg-neutral-100";
        if (d === "hard") return "text-neutral-700 bg-neutral-200";
        return "text-neutral-600 bg-neutral-100";
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 animate-fadeIn" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="bg-white rounded-2xl shadow-2xl border border-neutral-200/80 flex flex-col w-[80vw] max-w-[900px] min-w-[360px] animate-modalIn"
                    style={{ maxHeight: "90vh" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ─── Header ─── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-[0.08em]">
                                    Interview Prep
                                </span>
                                <p className="text-sm font-medium text-neutral-700 -mt-0.5">
                                    {jobTitle} <span className="text-neutral-400">at</span> {company}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ─── Body ─── */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">

                        {/* GENERATING */}
                        {phase === "generating" && !error && (
                            <div className="flex flex-col items-center justify-center py-28 gap-5">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-[3px] border-neutral-100 border-t-neutral-800 animate-spin" />
                                    <Sparkles className="w-5 h-5 text-neutral-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-neutral-700">Generating your quiz...</p>
                                    <p className="text-xs text-neutral-400 mt-1">Creating 20 tailored questions using AI</p>
                                </div>
                            </div>
                        )}

                        {/* ERROR */}
                        {error && (
                            <div className="flex flex-col items-center justify-center py-28 gap-3 text-neutral-500">
                                <XCircle className="w-10 h-10" />
                                <p className="text-sm">{error}</p>
                                <button onClick={onClose} className="text-xs font-medium hover:underline">Close</button>
                            </div>
                        )}

                        {/* QUIZ MODE */}
                        {phase === "quiz" && q && (
                            <div className="p-6">
                                {/* Progress bar */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-neutral-800 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="text-[11px] font-bold text-neutral-400 tabular-nums whitespace-nowrap">
                                        {currentQ + 1} / {questions.length}
                                    </span>
                                </div>

                                {/* Question Card */}
                                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 mb-6">
                                    {/* Badges */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-white px-2 py-0.5 rounded">
                                            {typeIcon(q.type)} {typeLabel(q.type)}
                                        </span>
                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", diffColor(q.difficulty))}>
                                            {q.difficulty}
                                        </span>
                                        {q.topic && (
                                            <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                                {q.topic}
                                            </span>
                                        )}
                                    </div>

                                    {/* Question text */}
                                    <p className="text-[15px] text-neutral-800 leading-[1.7] font-medium whitespace-pre-line">
                                        {q.question}
                                    </p>
                                </div>

                                {/* Answer Input */}
                                <div className="mb-6">
                                    {q.type === "mcq" && q.options ? (
                                        <div className="space-y-2">
                                            {q.options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setAnswers(prev => ({ ...prev, [q.index]: opt }))}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150",
                                                        answers[q.index] === opt
                                                            ? "border-neutral-800 bg-neutral-900 text-white"
                                                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                                                    )}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    ) : q.type === "coding" ? (
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                                                Your Code
                                            </label>
                                            <textarea
                                                value={answers[q.index] || ""}
                                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.index]: e.target.value }))}
                                                placeholder="Write your solution here..."
                                                rows={8}
                                                className="w-full px-4 py-3 rounded-lg border border-neutral-200 text-sm text-neutral-800 bg-neutral-50 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 resize-y"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                                                Your Answer
                                            </label>
                                            <textarea
                                                value={answers[q.index] || ""}
                                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.index]: e.target.value }))}
                                                placeholder="Type your answer..."
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-lg border border-neutral-200 text-sm text-neutral-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-400 resize-y"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Question Navigator */}
                                <div className="flex flex-wrap gap-1.5 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                    {questions.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentQ(i)}
                                            className={cn(
                                                "w-7 h-7 rounded text-[10px] font-bold transition-all duration-150",
                                                i === currentQ
                                                    ? "bg-neutral-900 text-white"
                                                    : answers[i] !== undefined
                                                        ? "bg-neutral-300 text-white"
                                                        : "bg-white text-neutral-400 border border-neutral-200 hover:border-neutral-400"
                                            )}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SUBMITTING */}
                        {phase === "submitting" && (
                            <div className="flex flex-col items-center justify-center py-28 gap-5">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-[3px] border-neutral-100 border-t-neutral-800 animate-spin" />
                                    <CheckCircle2 className="w-5 h-5 text-neutral-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-neutral-700">Evaluating your answers...</p>
                                    <p className="text-xs text-neutral-400 mt-1">AI is grading short answers & coding solutions</p>
                                </div>
                            </div>
                        )}

                        {/* RESULTS */}
                        {phase === "results" && result && (
                            <div className="p-6">
                                {/* Score Hero */}
                                <div className="flex items-center gap-8 mb-8 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
                                    <div className="flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-neutral-300 flex flex-col items-center justify-center bg-white">
                                        <span className="text-3xl font-bold text-neutral-900">{result.score}%</span>
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Score</span>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <StatBox label="Grade" value={result.grade} />
                                        <StatBox label="Correct" value={String(result.correct)} sub={`/ ${result.total}`} />
                                        <StatBox label="Wrong" value={String(result.wrong)} />
                                        <StatBox label="Skipped" value={String(result.skipped)} />
                                    </div>
                                </div>

                                {/* Time taken */}
                                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6">
                                    <Clock className="w-3.5 h-3.5" />
                                    Time: {formatTime(Math.floor((Date.now() - startTime) / 1000))}
                                </div>

                                {/* Question Review */}
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 mb-3 pb-2 border-b border-neutral-100">
                                    Question Review
                                </h3>
                                <div className="space-y-2">
                                    {result.feedback.map((fb, i) => (
                                        <div key={i}>
                                            <button
                                                onClick={() => setReviewIndex(reviewIndex === i ? null : i)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-150",
                                                    fb.is_correct
                                                        ? "bg-white border-neutral-200 hover:border-neutral-300"
                                                        : fb.skipped
                                                            ? "bg-neutral-50 border-neutral-200 hover:border-neutral-300"
                                                            : "bg-white border-neutral-200 hover:border-neutral-300"
                                                )}
                                            >
                                                {fb.is_correct ? (
                                                    <CheckCircle2 className="w-4 h-4 text-neutral-800 flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                )}
                                                <span className="text-xs font-medium text-neutral-600 flex-1 truncate">
                                                    Q{fb.index + 1}. {questions[fb.index]?.question.slice(0, 80)}...
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                                    fb.is_correct ? "bg-neutral-100 text-neutral-700" : "bg-neutral-100 text-neutral-400"
                                                )}>
                                                    {fb.is_correct ? "Correct" : fb.skipped ? "Skipped" : "Wrong"}
                                                </span>
                                                <ChevronRight className={cn(
                                                    "w-4 h-4 text-neutral-300 transition-transform",
                                                    reviewIndex === i && "rotate-90"
                                                )} />
                                            </button>

                                            {/* Expanded review */}
                                            {reviewIndex === i && (
                                                <div className="ml-7 mt-2 mb-3 p-4 bg-neutral-50 rounded-lg border border-neutral-100 space-y-3 text-sm animate-modalIn">
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Your Answer</p>
                                                        <p className="text-neutral-600 whitespace-pre-wrap font-mono text-xs bg-white p-2 rounded border border-neutral-100">
                                                            {fb.user_answer || "(skipped)"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">Correct Answer</p>
                                                        <p className="text-neutral-700 whitespace-pre-wrap font-mono text-xs bg-white p-2 rounded border border-neutral-100">
                                                            {fb.correct_answer}
                                                        </p>
                                                    </div>
                                                    {fb.feedback && (
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1">AI Feedback</p>
                                                            <p className="text-neutral-600 text-xs leading-relaxed">{fb.feedback}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Footer Actions ─── */}
                    {phase === "quiz" && (
                        <div className="border-t border-neutral-100 bg-white px-6 py-3.5 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                                    disabled={currentQ === 0}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-200 text-neutral-600 bg-white hover:bg-neutral-50 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                </button>

                                <div className="flex-1 text-center">
                                    <span className="text-[11px] font-medium text-neutral-400">
                                        {answeredCount} of {questions.length} answered
                                    </span>
                                </div>

                                {currentQ < questions.length - 1 ? (
                                    <button
                                        onClick={() => setCurrentQ(currentQ + 1)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-200 text-neutral-600 bg-white hover:bg-neutral-900 hover:text-white hover:border-neutral-900 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                                    >
                                        Next <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-700 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                                    >
                                        Submit Quiz <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Results footer */}
                    {phase === "results" && (
                        <div className="border-t border-neutral-100 bg-white px-6 py-3.5 flex-shrink-0">
                            <div className="flex items-center justify-end gap-2.5">
                                <button
                                    onClick={onClose}
                                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-700 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
        .animate-modalIn { animation: modalIn 0.2s ease-out; }
      `}</style>
        </>
    );
}

/* ─── Stat Box ─── */
function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-neutral-800">
                {value} {sub && <span className="text-xs font-normal text-neutral-400">{sub}</span>}
            </p>
        </div>
    );
}
