"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, RefreshCw, Bookmark, BookmarkCheck,
  MapPin, ExternalLink, Briefcase, GraduationCap,
  Clock, Loader2, X, Zap, Trophy,
  ArrowLeft, Globe2, Filter, SlidersHorizontal, Wifi, Globe,
  Star, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import JobDetailDrawer from "@/components/JobDetailDrawer";
import PrepLab from "@/components/PrepLab";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import ResumeBuilder from "@/components/ResumeBuilder";
import { createClient } from "@/lib/supabase";
import { ProfileData } from "@/components/ProfilePreview";

const API_BASE = "http://localhost:8000/api/opportunities";

interface Item {
  id: string; title: string; company: string; location: string;
  url: string; source: string; type: string; salary?: string;
  posted_date?: string; is_remote?: boolean; tags?: string[];
  description?: string; match_score?: number; dates?: string;
  prizes?: string; deadline?: string; is_fully_funded?: boolean;
  category?: string; pinned?: boolean;
}

type TabType = "internships" | "jobs" | "hackathons" | "international";
type IntlCategoryFilter = "all" | "program" | "internship" | "job" | "summit";

const LOCATION_OPTIONS = [
  "All Locations", "Remote", "Bangalore", "Mumbai", "Delhi", "Hyderabad",
  "Chennai", "Pune", "Kolkata", "Ahmedabad", "Gurgaon", "Noida", "India"
];

const STIPEND_OPTIONS = [
  { label: "Any Stipend", value: "all" },
  { label: "Paid Only", value: "paid" },
  { label: "₹0 – ₹10K", value: "0-10000" },
  { label: "₹10K – ₹25K", value: "10000-25000" },
  { label: "₹25K+", value: "25000+" },
];

const INTL_CATEGORIES: { key: IntlCategoryFilter; label: string; icon: any }[] = [
  { key: "all", label: "All", icon: Globe },
  { key: "program", label: "Programs", icon: Award },
  { key: "internship", label: "Internships", icon: GraduationCap },
  { key: "job", label: "Jobs", icon: Briefcase },
  { key: "summit", label: "Summits & Competitions", icon: Trophy },
];

export default function OpportunitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("internships");
  const [dbItems, setDbItems] = useState<Item[]>([]);
  const [liveItems, setLiveItems] = useState<Item[]>([]);
  const [hackathons, setHackathons] = useState<Item[]>([]);
  const [internationalItems, setInternationalItems] = useState<Item[]>([]);
  const [loadingDB, setLoadingDB] = useState(true);
  const [loadingLive, setLoadingLive] = useState(false);
  const [loadingScrape, setLoadingScrape] = useState(false);
  const [loadingIntl, setLoadingIntl] = useState(false);
  const [intlFetched, setIntlFetched] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set<string>());

  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [stipendFilter, setStipendFilter] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [intlCategoryFilter, setIntlCategoryFilter] = useState<IntlCategoryFilter>("all");

  // ─── Job Detail Drawer state ───
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ─── Prep Lab state ───
  const [prepOpen, setPrepOpen] = useState(false);
  const [prepJob, setPrepJob] = useState<any>(null);

  // ─── Resume Builder state ───
  const [resumeBuilderOpen, setResumeBuilderOpen] = useState(false);
  const [resumeJob, setResumeJob] = useState<any>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const supabase = createClient();

  const openJobDrawer = (id: string) => {
    setSelectedJobId(id);
    setDrawerOpen(true);
  };
  const closeJobDrawer = () => {
    setDrawerOpen(false);
    setSelectedJobId(null);
  };

  useEffect(() => {
    fetchDBData();
    if (user) fetchBookmarks();
  }, [user]);

  // Auto-fetch international when tab is first clicked
  useEffect(() => {
    if (activeTab === "international" && !intlFetched && !loadingIntl) {
      fetchInternational();
    }
  }, [activeTab]);

  const fetchDBData = async () => {
    setLoadingDB(true);
    try {
      const jobsUrl = user
        ? `${API_BASE}/db/jobs?limit=300&user_id=${user.id}`
        : `${API_BASE}/db/jobs?limit=300`;
      const [jobsRes, hackRes] = await Promise.all([
        fetch(jobsUrl),
        fetch(`${API_BASE}/db/hackathons?limit=100`),
      ]);
      if (jobsRes.ok) { const d = await jobsRes.json(); setDbItems(d.items || []); }
      if (hackRes.ok) { const d = await hackRes.json(); setHackathons(d.items || []); }
    } catch (err) { console.error(err); }
    finally { setLoadingDB(false); }
  };

  const fetchLiveResults = async () => {
    if (!user) return;
    setLoadingLive(true);
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, force_refresh: true }),
      });
      if (res.ok) { const d = await res.json(); setLiveItems(d.opportunities || []); }
    } catch { }
    finally { setLoadingLive(false); }
  };

  const fetchInternational = async () => {
    setLoadingIntl(true);
    try {
      const params = new URLSearchParams();
      if (user) params.set("user_id", user.id);
      const res = await fetch(`${API_BASE}/international?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setInternationalItems(d.items || []);
        setIntlFetched(true);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingIntl(false); }
  };

  const triggerScrape = async () => {
    setLoadingScrape(true);
    try { await fetch(`${API_BASE}/scrape`, { method: "POST" }); await fetchDBData(); } catch { }
    setLoadingScrape(false);
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/bookmarks?user_id=${user.id}`);
      if (res.ok) {
        const d = await res.json();
        const ids = new Set<string>((d.bookmarks || []).map((b: any) => {
          const o = b.opportunity_data || {};
          return (o.title || "") + (o.company || "");
        }));
        setBookmarkedIds(ids);
      }
    } catch { }
  };

  const toggleBookmark = async (item: Item) => {
    if (!user) return;
    const key = item.title + item.company;
    if (bookmarkedIds.has(key)) {
      setBookmarkedIds(prev => { const n = new Set(prev); n.delete(key); return n; });
    } else {
      try {
        await fetch(`${API_BASE}/bookmark`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, opportunity_data: item, source: item.source }),
        });
        setBookmarkedIds(prev => new Set(prev).add(key));
      } catch { }
    }
  };

  const allInternships = useMemo(() => dedup([
    ...liveItems.filter(i => i.type === "internship" || i.type === "program"),
    ...dbItems.filter(i => i.type === "internship"),
  ]), [dbItems, liveItems]);

  const allJobs = useMemo(() => dedup([
    ...liveItems.filter(i => i.type === "job"),
    ...dbItems.filter(i => i.type === "job"),
  ]), [dbItems, liveItems]);

  const allHackathons = useMemo(() => dedup([
    ...hackathons,
    ...liveItems.filter(i => i.type === "hackathon"),
  ]), [hackathons, liveItems]);

  const allSources = useMemo(() => {
    let data: Item[];
    if (activeTab === "international") data = internationalItems;
    else if (activeTab === "internships") data = allInternships;
    else if (activeTab === "jobs") data = allJobs;
    else data = allHackathons;
    return Array.from(new Set(data.map(i => i.source))).sort();
  }, [activeTab, allInternships, allJobs, allHackathons, internationalItems]);

  const currentData = useMemo(() => {
    let data: Item[];
    if (activeTab === "international") {
      data = [...internationalItems];
      // Apply sub-category filter
      if (intlCategoryFilter !== "all") {
        data = data.filter(i => i.category === intlCategoryFilter);
      }
    } else if (activeTab === "internships") {
      data = allInternships;
    } else if (activeTab === "jobs") {
      data = allJobs;
    } else {
      data = allHackathons;
    }

    if (searchText) {
      const q = searchText.toLowerCase();
      data = data.filter(i => `${i.title} ${i.company} ${i.location} ${(i.tags || []).join(" ")} ${i.description || ""}`.toLowerCase().includes(q));
    }
    if (remoteOnly) data = data.filter(i => i.is_remote);
    if (locationFilter !== "All Locations" && activeTab !== "international") {
      if (locationFilter === "Remote") data = data.filter(i => i.is_remote);
      else data = data.filter(i => (i.location || "").toLowerCase().includes(locationFilter.toLowerCase()));
    }
    if (sourceFilter !== "all") data = data.filter(i => i.source === sourceFilter);
    if (stipendFilter !== "all" && activeTab !== "hackathons" && activeTab !== "international") {
      data = data.filter(i => {
        if (!i.salary || i.salary === "N/A") return stipendFilter === "all";
        if (stipendFilter === "paid") return true;
        const nums = i.salary.match(/[\d,]+/g);
        if (!nums) return false;
        const val = parseInt(nums[0].replace(/,/g, ""));
        if (stipendFilter === "0-10000") return val <= 10000;
        if (stipendFilter === "10000-25000") return val > 10000 && val <= 25000;
        if (stipendFilter === "25000+") return val > 25000;
        return true;
      });
    }

    // For international: pinned items first
    if (activeTab === "international") {
      data.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    }

    return data;
  }, [activeTab, allInternships, allJobs, allHackathons, internationalItems, searchText, remoteOnly, locationFilter, sourceFilter, stipendFilter, intlCategoryFilter]);

  const sourceCounts = useMemo(() => {
    const c: Record<string, number> = {};
    currentData.forEach(i => { c[i.source] = (c[i.source] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [currentData]);

  // International category counts
  const intlCategoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    internationalItems.forEach(i => {
      const cat = i.category || "job";
      c[cat] = (c[cat] || 0) + 1;
    });
    return c;
  }, [internationalItems]);

  const activeFilterCount = [locationFilter !== "All Locations", sourceFilter !== "all", stipendFilter !== "all", remoteOnly].filter(Boolean).length;
  const clearFilters = () => { setSearchText(""); setLocationFilter("All Locations"); setSourceFilter("all"); setStipendFilter("all"); setRemoteOnly(false); setIntlCategoryFilter("all"); };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      <DashboardSidebar activeTab="opportunities" onTabChange={() => { }} />

      <div className="flex-1 md:ml-64 min-h-screen">
        {/* ─── Header ─── */}
        <div className="sticky top-0 z-20 bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Opportunities</h1>
                  <p className="text-neutral-500 text-sm">
                    {allInternships.length} internships · {allJobs.length} jobs · {allHackathons.length} hackathons
                    {internationalItems.length > 0 && ` · ${internationalItems.length} international`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeTab !== "international" && (
                  <>
                    <button onClick={fetchLiveResults} disabled={loadingLive}
                      className="text-sm flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50">
                      <RefreshCw className={cn("w-4 h-4", loadingLive && "animate-spin")} />
                      {loadingLive ? "Searching..." : "Live Search"}
                    </button>
                    <button onClick={triggerScrape} disabled={loadingScrape}
                      className="text-sm flex items-center gap-1.5 text-white font-medium px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors disabled:opacity-50">
                      <Globe2 className={cn("w-4 h-4", loadingScrape && "animate-spin")} />
                      {loadingScrape ? "Scraping..." : "Refresh Data"}
                    </button>
                  </>
                )}
                {activeTab === "international" && intlFetched && (
                  <button onClick={() => { setIntlFetched(false); fetchInternational(); }} disabled={loadingIntl}
                    className="text-sm flex items-center gap-1.5 text-white font-medium px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 transition-colors disabled:opacity-50">
                    <RefreshCw className={cn("w-4 h-4", loadingIntl && "animate-spin")} />
                    {loadingIntl ? "Refreshing..." : "Refresh International"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* ─── Tabs + Search ─── */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex gap-1">
              {([
                { key: "internships" as TabType, label: "Internships", icon: GraduationCap, count: allInternships.length },
                { key: "jobs" as TabType, label: "Jobs", icon: Briefcase, count: allJobs.length },
                { key: "hackathons" as TabType, label: "Hackathons", icon: Zap, count: allHackathons.length },
                { key: "international" as TabType, label: "International", icon: Globe, count: internationalItems.length },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
                    activeTab === tab.key ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                  )}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count > 0 && <span className={cn("text-[10px] font-bold", activeTab === tab.key ? "text-neutral-400" : "text-neutral-400")}>{tab.count}</span>}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-neutral-200 mx-1" />
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder={activeTab === "international" ? "Search programs, internships, competitions..." : `Search ${activeTab}...`}
                value={searchText} onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full" />
              {searchText && (
                <button onClick={() => setSearchText("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-neutral-400" /></button>
              )}
            </div>
            {activeTab !== "international" && (
              <button onClick={() => setShowFilters(!showFilters)}
                className={cn("p-2 rounded-lg transition-colors relative",
                  showFilters ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100"
                )}>
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-900 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{activeFilterCount}</span>}
              </button>
            )}
          </div>

          {/* ─── International Sub-category Chips ─── */}
          {activeTab === "international" && intlFetched && (
            <div className="flex flex-wrap gap-2">
              {INTL_CATEGORIES.map(cat => {
                const count = cat.key === "all" ? internationalItems.length : (intlCategoryCounts[cat.key] || 0);
                return (
                  <button key={cat.key} onClick={() => setIntlCategoryFilter(cat.key)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-all border flex items-center gap-1.5",
                      intlCategoryFilter === cat.key
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                    )}>
                    <cat.icon className="w-3.5 h-3.5" />
                    {cat.label}
                    <span className={cn("text-[10px] font-bold",
                      intlCategoryFilter === cat.key ? "text-neutral-400" : "text-neutral-400"
                    )}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ─── Filters (non-international tabs) ─── */}
          {showFilters && activeTab !== "international" && (
            <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-[11px] text-neutral-500 hover:text-neutral-900 font-medium">Clear all ({activeFilterCount})</button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">Location</label>
                  <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20">
                    {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">Source</label>
                  <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="all">All Sources</option>
                    {allSources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {activeTab !== "hackathons" && (
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">Stipend</label>
                    <select value={stipendFilter} onChange={(e) => setStipendFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20">
                      {STIPEND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 block">Work Mode</label>
                  <button onClick={() => setRemoteOnly(!remoteOnly)}
                    className={cn("w-full px-3 py-2 text-xs font-medium rounded-lg border transition-colors",
                      remoteOnly ? "bg-neutral-900 border-neutral-900 text-white" : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                    )}>
                    {remoteOnly ? "Remote Only ✓" : "All Modes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Source chips (non-international) */}
          {activeTab !== "international" && sourceCounts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sourceCounts.map(([src, count]) => (
                <button key={src} onClick={() => setSourceFilter(sourceFilter === src ? "all" : src)}
                  className={cn("text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all border",
                    sourceFilter === src ? "bg-neutral-900 text-white border-neutral-900" : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100"
                  )}>
                  {src}: {count}
                </button>
              ))}
            </div>
          )}

          {/* ─── Content ─── */}
          {(loadingDB || (activeTab === "international" && loadingIntl && !intlFetched)) ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-900" />
                {activeTab === "international" && (
                  <p className="text-sm text-neutral-500">Fetching curated programs & global listings...</p>
                )}
              </div>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl bg-white">
              {activeTab === "international" ? <Globe className="w-12 h-12 mb-4 opacity-20" /> :
                activeTab === "hackathons" ? <Zap className="w-12 h-12 mb-4 opacity-20" /> :
                  activeTab === "internships" ? <GraduationCap className="w-12 h-12 mb-4 opacity-20" /> :
                    <Briefcase className="w-12 h-12 mb-4 opacity-20" />}
              <p className="text-lg font-medium text-neutral-600">
                {searchText || activeFilterCount > 0 ? "No results match your filters" : `No ${activeTab} found`}
              </p>
              <p className="text-sm">
                {searchText || activeFilterCount > 0 ? "Try adjusting your filters" : "Click \"Refresh Data\" to fetch listings"}
              </p>
              {activeFilterCount > 0 && <button onClick={clearFilters} className="mt-2 text-xs text-neutral-600 hover:text-neutral-900 font-medium">Clear filters</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentData.map((item, i) => {
                const bKey = item.title + item.company;
                const isPinned = item.pinned;
                return (
                  <div key={`${item.source}-${item.id}-${i}`}
                    className={cn(
                      "p-4 rounded-xl border transition-all group",
                      isPinned
                        ? "bg-neutral-50 border-neutral-300 ring-1 ring-neutral-200 hover:shadow-md"
                        : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
                    )}>
                    {/* Title */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isPinned && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                          <h3 onClick={() => (activeTab === "internships" || activeTab === "jobs") && item.id ? openJobDrawer(item.id) : null}
                            className={cn("font-semibold text-sm text-neutral-900 leading-snug line-clamp-2",
                              (activeTab === "internships" || activeTab === "jobs") && item.id ? "cursor-pointer hover:text-blue-700 hover:underline underline-offset-2 transition-colors" : ""
                            )}>{item.title}</h3>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">{item.company}</p>
                      </div>
                      <button onClick={() => toggleBookmark(item)}
                        className={cn("p-1.5 rounded-lg transition-colors flex-shrink-0",
                          bookmarkedIds.has(bKey) ? "text-neutral-900 bg-neutral-100" : "text-neutral-300 hover:text-neutral-900 hover:bg-neutral-50"
                        )}>
                        {bookmarkedIds.has(bKey) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Description (for international pinned items) */}
                    {activeTab === "international" && item.description && (
                      <p className="text-[11px] text-neutral-500 mt-1.5 line-clamp-2">{item.description}</p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap text-[11px] text-neutral-500">
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.is_remote ? "Remote" : (item.location || "—")}</span>
                      {item.salary && item.salary !== "N/A" && item.salary !== "See Details" && (
                        <span className="font-medium text-neutral-700">₹ {item.salary}</span>
                      )}
                      {(activeTab === "hackathons") && item.dates && (
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {item.dates}</span>
                      )}
                      {activeTab === "international" && item.dates && (
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {item.dates}</span>
                      )}
                      {(activeTab === "hackathons") && item.prizes && item.prizes !== "See Details" && (
                        <span className="inline-flex items-center gap-1"><Trophy className="w-3 h-3" /> {item.prizes}</span>
                      )}
                      {item.match_score != null && item.match_score > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">{item.match_score}%</span>
                      )}
                    </div>

                    {/* Tags */}
                    {activeTab === "international" && item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 4).map((tag, ti) => (
                          <span key={ti} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">{item.source}</span>
                        {activeTab === "international" && item.category && (
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            item.category === "program" ? "bg-blue-50 text-blue-600" :
                              item.category === "internship" ? "bg-green-50 text-green-600" :
                                item.category === "summit" ? "bg-purple-50 text-purple-600" :
                                  "bg-neutral-100 text-neutral-500"
                          )}>{item.category}</span>
                        )}
                      </div>
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium text-neutral-900 hover:underline">
                        {activeTab === "hackathons" ? "Register →" :
                          activeTab === "international" && isPinned ? "Learn More →" : "Apply →"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Loading toast */}
        {(loadingLive || loadingScrape || (loadingIntl && intlFetched) || loadingProfile) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-[60]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-xs font-medium">
              {loadingScrape ? "Scraping latest data..." :
                loadingIntl ? "Refreshing international..." :
                  loadingProfile ? "Loading profile data..." :
                    "Searching live APIs..."}
            </span>
          </div>
        )}

        {/* ─── Job Detail Drawer ─── */}
        <JobDetailDrawer
          jobId={selectedJobId}
          userId={user?.id}
          isOpen={drawerOpen}
          onClose={closeJobDrawer}
          isBookmarked={selectedJobId ? bookmarkedIds.has(
            (currentData.find(i => i.id === selectedJobId)?.title || "") +
            (currentData.find(i => i.id === selectedJobId)?.company || "")
          ) : false}
          onToggleBookmark={() => {
            const item = currentData.find(i => i.id === selectedJobId);
            if (item) toggleBookmark(item);
          }}
          onStartPrep={(detail) => {
            setPrepJob(detail);
            setDrawerOpen(false);
            setPrepOpen(true);
          }}
          onTailorResume={async (detail) => {
            if (!user) return;
            setLoadingProfile(true);
            setResumeJob(detail);
            try {
              const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
              if (data) {
                const resume = data.resume_data || {};
                const pData: ProfileData = {
                  id: data.id,
                  fullName: data.full_name || resume.full_name || user.email || "User",
                  headline: resume.headline || "Student",
                  email: user.email || "",
                  phone: resume.phone || "",
                  website: data.website || resume.website || "",
                  github: resume.github || "",
                  linkedin: resume.linkedin || "",
                  location: resume.location || "",
                  avatarUrl: data.avatar_url || resume.avatarUrl,
                  skills: resume.skills || [],
                  education: resume.education || [],
                  experience: resume.experience || [],
                  projects: resume.projects || [],
                  country: resume.country || "",
                  state: resume.state || "",
                  city: resume.city || "",
                  careerGoal: resume.careerGoal || "",
                  experienceLevel: resume.experienceLevel || "",
                  yearOfStudy: resume.yearOfStudy || ""
                };
                setProfileData(pData);
                setDrawerOpen(false);
                setResumeBuilderOpen(true);
              }
            } catch (err) {
              console.error("Error fetching profile:", err);
            } finally {
              setLoadingProfile(false);
            }
          }}
        />

        {/* Prep Lab Modal */}
        {prepJob && (
          <PrepLab
            isOpen={prepOpen}
            onClose={() => { setPrepOpen(false); setPrepJob(null); }}
            jobTitle={prepJob.title}
            company={prepJob.company}
            jobId={prepJob.id}
            userId={user?.id || ""}
            techStack={prepJob.tech_stack || []}
            requirements={prepJob.requirements || []}
            responsibilities={prepJob.responsibilities || []}
          />
        )}

        {/* Resume Builder Modal */}
        {resumeBuilderOpen && resumeJob && profileData && (
          <ResumeBuilder
            isOpen={resumeBuilderOpen}
            onClose={() => { setResumeBuilderOpen(false); setResumeJob(null); }}
            userId={user?.id || ""}
            jobDetail={{
              id: resumeJob.id,
              title: resumeJob.title,
              company: resumeJob.company,
              description: resumeJob.description || "",
              requirements: resumeJob.requirements || []
            }}
            profileData={profileData}
          />
        )}
      </div>
    </div>
  );
}

function dedup(items: Item[]): Item[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.title.toLowerCase().trim().slice(0, 50)}|${item.company.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
