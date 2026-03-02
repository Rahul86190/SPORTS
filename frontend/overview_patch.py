import re

filepath = r'e:\Projects\SPORTS\frontend\components\dashboard\tabs\OverviewTab.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ResumeBuilder import
import_stmt = 'import { ArrowRight, User, Briefcase, Map, Clock, Trophy, Loader2, Hash, FileText, Sparkles } from \'lucide-react\';\nimport ResumeBuilder from "@/components/ResumeBuilder";'
content = content.replace("import { ArrowRight, User, Briefcase, Map, Clock, Trophy, Loader2, Hash, FileText, Sparkles } from 'lucide-react';", import_stmt)

# 2. Add state for selected resume ID
state_stmt = """    const [resumes, setResumes] = useState<TailoredResume[]>([]);
    const [loadingPrep, setLoadingPrep] = useState(true);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);"""
content = content.replace("""    const [resumes, setResumes] = useState<TailoredResume[]>([]);
    const [loadingPrep, setLoadingPrep] = useState(true);""", state_stmt)

# 3. Add onClick to the resume cards
card_pattern = r'<div key=\{r\.id\} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">'
card_repl = '<div key={r.id} onClick={() => setSelectedResumeId(r.id)} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 hover:border-neutral-400 hover:shadow-md cursor-pointer transition-all">'
content = content.replace(card_pattern, card_repl)

# 4. Inject ResumeBuilder at bottom
builder_inject = """            </div>

            {selectedResumeId && (
                <ResumeBuilder
                    isOpen={!!selectedResumeId}
                    onClose={() => setSelectedResumeId(null)}
                    userId={user?.id || ""}
                    jobDetail={null}
                    profileData={null}
                    savedResumeId={selectedResumeId}
                />
            )}
        </div>
    );"""
content = content.replace("""            </div>
        </div>
    );""", builder_inject)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Overview patched successfully")
