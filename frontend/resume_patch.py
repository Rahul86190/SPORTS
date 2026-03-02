import re

filepath = r'e:\Projects\SPORTS\frontend\components\ResumeBuilder.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update ResumeBuilderProps
props_repl = """interface ResumeBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    jobDetail: JobDetail | null;
    profileData: ProfileData | null;
    savedResumeId?: string;
}"""
content = re.sub(r'interface ResumeBuilderProps \{.*?\n\}', props_repl, content, flags=re.DOTALL)

# 2. Update Signature
content = content.replace(
    """export default function ResumeBuilder({
    isOpen, onClose, userId, jobDetail, profileData
}: ResumeBuilderProps) {""", 
    """export default function ResumeBuilder({
    isOpen, onClose, userId, jobDetail, profileData, savedResumeId
}: ResumeBuilderProps) {"""
)

# 3. Update the useEffect logic
use_effect_regex = r'    // Generate tailored resume on open\n    useEffect\(\(\) => \{\n        if \(\!isOpen\) return;\n.*?    \}, \[isOpen\]\);'

new_use_effect = """    // Generate or Fetch tailored resume on open
    useEffect(() => {
        if (!isOpen) return;
        setPhase("generating");
        setResumeData(null);
        setError(null);
        setActiveTab("summary");

        const fetchOrGenerate = async () => {
            try {
                // If opening a saved resume from the Overview Tab
                if (savedResumeId) {
                    const res = await fetch(`${API_BASE}/saved/${savedResumeId}?user_id=${userId}`);
                    if (!res.ok) throw new Error("Failed to load saved resume");
                    
                    const data = await res.json();
                    
                    // The data structure here has ats_score at the root, returning resume_data JSON object
                    setResumeData(data.resume_data);
                    setAtsScore(data.ats_score);
                    setPhase("editing");
                    return;
                }

                // Otherwise, we are doing a fresh Tailor from the Opportunities Tab
                if (!jobDetail || !profileData) {
                    throw new Error("Missing job or profile data for tailoring");
                }

                const res = await fetch(`${API_BASE}/tailor`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        job_id: jobDetail.id,
                        job_title: jobDetail.title,
                        company_name: jobDetail.company,
                        job_description: jobDetail.description || "",
                        job_requirements: jobDetail.requirements || [],
                        resume_data: profileData,
                    }),
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    throw new Error(errorData?.detail || `Failed to tailor resume (${res.status})`);
                }
                const data = await res.json();

                // Fallback to original data if AI failed to return specific arrays
                const tailored = data.resume_data;
                if (!tailored.skills) tailored.skills = profileData.skills;
                if (!tailored.experience) tailored.experience = profileData.experience;
                if (!tailored.projects) tailored.projects = profileData.projects;
                if (!tailored.education) tailored.education = profileData.education;

                setResumeData(tailored);
                setAtsScore(data.ats_score);
                setPhase("editing");
            } catch (e: any) {
                console.error("Resume Action error:", e);
                setError(e.message || "Failed to connect to server. Please try again.");
                setPhase("error");
            }
        };
        fetchOrGenerate();
    }, [isOpen, savedResumeId, userId, jobDetail, profileData]);"""

content = re.sub(use_effect_regex, new_use_effect, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
