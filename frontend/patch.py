import re

with open(r'e:\\Projects\\SPORTS\\frontend\\components\\ResumeBuilder.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """    const handleDownloadDocx = async () => {
        if (!resumeData) return;
        setIsDownloading(true);
        try {
            const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType } = await import("docx");

            const contactParts = [];
            if (resumeData.email) contactParts.push(resumeData.email);
            if (resumeData.phone) contactParts.push(resumeData.phone);
            if (resumeData.location || resumeData.city) contactParts.push(resumeData.location || `${resumeData.city || ""}${resumeData.country ? ", " + resumeData.country : ""}`);
            if (resumeData.linkedin) contactParts.push(resumeData.linkedin.replace('https://linkedin.com/in/', 'linkedin.com/in/').replace('https://www.linkedin.com/in/', 'linkedin.com/in/'));
            if (resumeData.github) contactParts.push(resumeData.github.replace('https://github.com/', 'github.com/'));

            const contactRuns = contactParts.flatMap((part, index) => {
                const arr = [new TextRun({ text: part, size: 18, color: "555555" })];
                if (index < contactParts.length - 1) arr.push(new TextRun({ text: "  |  ", size: 18, color: "999999" }));
                return arr;
            });

            const doc = new Document({
                styles: {
                    paragraphStyles: [
                        {
                            id: "Normal", name: "Normal", basedOn: "Normal", next: "Normal",
                            run: { font: "Arial", size: 20, color: "333333" }, // 10pt
                            paragraph: { spacing: { line: 276, before: 0, after: 0 } }, // ~1.15 line spacing
                        },
                        {
                            id: "Name", name: "Name", basedOn: "Normal",
                            run: { size: 48, bold: true, color: "111111" }, // 24pt
                            paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 } },
                        },
                        {
                            id: "ContactInfo", name: "Contact Info", basedOn: "Normal",
                            paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 } },
                        },
                        {
                            id: "SectionHeader", name: "Section Header", basedOn: "Normal",
                            run: { size: 22, bold: true, allCaps: true, color: "111111", tracking: 10 }, // 11pt
                            paragraph: {
                                border: { bottom: { color: "111111", space: 4, style: BorderStyle.SINGLE, size: 12 } }, // 1.5pt border
                                spacing: { before: 240, after: 80 },
                            },
                        },
                        {
                            id: "ItemTitle", name: "Item Title", basedOn: "Normal",
                            run: { size: 22, bold: true, color: "111111" },
                            paragraph: {
                                spacing: { before: 120, after: 40 },
                                tabStops: [{ type: TabStopType.RIGHT, position: 10000 }], // Right align tab for dates
                            },
                        }
                    ],
                },
                sections: [{
                    properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
                    children: [
                        new Paragraph({ text: resumeData.fullName || "User", style: "Name" }),
                        new Paragraph({ children: contactRuns, style: "ContactInfo" }),
                        
                        new Paragraph({ text: "PROFESSIONAL SUMMARY", style: "SectionHeader" }),
                        new Paragraph({ text: resumeData.headline || "", style: "Normal" }),
                        
                        ...(resumeData.skills?.length ? [
                            new Paragraph({ text: "TECHNICAL SKILLS", style: "SectionHeader" }),
                            new Paragraph({ text: resumeData.skills.join(" \\u2022 "), style: "Normal" })
                        ] : []),

                        ...(resumeData.experience?.length ? [
                            new Paragraph({ text: "EXPERIENCE", style: "SectionHeader" }),
                            ...resumeData.experience.flatMap(exp => [
                                new Paragraph({
                                    style: "ItemTitle",
                                    children: [
                                        new TextRun({ text: exp.title, bold: true, size: 22, color: "111111" }),
                                        new TextRun({ text: ` - ${exp.company}`, italics: true, size: 22, color: "333333" }),
                                        new TextRun({ text: `\\t${exp.duration || ""}`, size: 20, italics: true, color: "555555" })
                                    ]
                                }),
                                ...(exp.details || "").split('\\n').map(bullet => {
                                    const trimmed = bullet.trim().replace(/^[-*\\u2022]\\s*/, '');
                                    return trimmed ? new Paragraph({ text: trimmed, style: "Normal", indent: { left: 240, hanging: 240 }, bullet: { level: 0 } }) : null;
                                }).filter(Boolean)
                            ])
                        ] : []),

                        ...(resumeData.projects?.length ? [
                            new Paragraph({ text: "PROJECTS", style: "SectionHeader" }),
                            ...resumeData.projects.flatMap(proj => [
                                new Paragraph({
                                    style: "ItemTitle",
                                    children: [
                                        new TextRun({ text: proj.name, bold: true, size: 22, color: "111111" }),
                                        new TextRun({ text: proj.tech_stack?.length ? ` | ${proj.tech_stack.join(", ")}` : "", italics: true, size: 20, color: "555555" }),
                                    ]
                                }),
                                ...(proj.description || "").split('\\n').map(bullet => {
                                    const trimmed = bullet.trim().replace(/^[-*\\u2022]\\s*/, '');
                                    return trimmed ? new Paragraph({ text: trimmed, style: "Normal", indent: { left: 240, hanging: 240 }, bullet: { level: 0 } }) : null;
                                }).filter(Boolean)
                            ])
                        ] : []),

                        ...(resumeData.education?.length ? [
                            new Paragraph({ text: "EDUCATION", style: "SectionHeader" }),
                            ...resumeData.education.flatMap(edu => [
                                new Paragraph({
                                    style: "ItemTitle",
                                    children: [
                                        new TextRun({ text: edu.institution, bold: true, size: 22, color: "111111" }),
                                        new TextRun({ text: `\\t${edu.year || ""}`, italics: true, size: 20, color: "555555" })
                                    ]
                                }),
                                new Paragraph({ text: edu.degree || "", style: "Normal" }),
                            ])
                        ] : [])
                    ],
                }]
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${(resumeData.fullName || "Resume").replace(/\\s+/g, "_")}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to generate DOCX", e);
        } finally {
            setIsDownloading(false);
        }
    };"""

pattern = r'    const handleDownloadDocx = async \(\) => \{.*?URL\.revokeObjectURL\(url\);\n        \} catch \(e\) \{\n            console\.error\("Failed to generate DOCX", e\);\n        \} finally \{\n            setIsDownloading\(false\);\n        \}\n    \};'

new_content = re.sub(pattern, lambda _: new_func, content, flags=re.DOTALL)

with open(r'e:\\Projects\\SPORTS\\frontend\\components\\ResumeBuilder.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Updated successfully")
