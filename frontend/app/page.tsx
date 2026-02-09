"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Terminal, TrendingUp, Award, Briefcase } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      <Navbar />

      <main className="pt-32 pb-20 px-6">

        {/* Modern Minimal Hero */}
        <section className="max-w-4xl mx-auto text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200 bg-white mb-8 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-medium text-neutral-600">Now live for students</span>
          </motion.div>

          <motion.h1
            {...fadeInUp}
            className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 mb-8 leading-[1.1]"
          >
            Navigate your career <br />
            <span className="text-neutral-400">with precision.</span>
          </motion.h1>

          <motion.p
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            SPORTS.ai is the intelligent layer between your skills and your dream job.
            Track progress, validate expertise, and get hired.
          </motion.p>

          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/signup"
              className="px-8 py-4 rounded-full bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-all flex items-center gap-2 group shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all font-medium flex items-center gap-2"
            >
              Sign In
            </Link>
          </motion.div>
        </section>

        {/* Minimal Grid Features */}
        <section id="features" className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
          <FeatureCard
            title="Smart Roadmap"
            desc="Dynamic path generation based on your current skills and target role."
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <FeatureCard
            title="Adaptive Testing"
            desc="Assessments that get harder as you get better. True skill validation."
            icon={<Terminal className="w-5 h-5" />}
          />
          <FeatureCard
            title="Verified Profile"
            desc="A live portfolio that proves your capabilities to recruiters."
            icon={<Award className="w-5 h-5" />}
          />
          <FeatureCard
            title="Job Matching"
            desc="Direct connections to companies looking for your specific stack."
            icon={<Briefcase className="w-5 h-5" />}
          />
        </section>

        {/* How it works (Simplified) */}
        <section className="max-w-4xl mx-auto mt-32">
          <div className="flex flex-col gap-12">
            <Step
              number="01"
              title="Create your profile"
              desc="Import data from GitHub and LinkedIn to build your baseline."
            />
            <div className="w-px h-12 bg-neutral-200 ml-6"></div>
            <Step
              number="02"
              title="Take the assessment"
              desc="Validate your skills through our adaptive testing engine."
            />
            <div className="w-px h-12 bg-neutral-200 ml-6"></div>
            <Step
              number="03"
              title="Follow your path"
              desc="Complete daily sprints and close the gap to your dream job."
            />
          </div>
        </section>

      </main>

      {/* Simple Footer */}
      <footer className="border-t border-neutral-100 py-12 text-center text-sm text-neutral-500">
        <p>&copy; 2026 SPORTS.ai. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 flex flex-col items-start gap-4 hover:bg-neutral-50 transition-colors">
      <div className="p-3 rounded-lg bg-neutral-100 text-neutral-900">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-neutral-900 mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6 items-start group">
      <span className="text-sm font-mono font-medium text-neutral-400 pt-1">{number}</span>
      <div>
        <h3 className="text-xl font-medium text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors">{title}</h3>
        <p className="text-neutral-600 max-w-md">{desc}</p>
      </div>
    </div>
  )
}
