import re

def update_resume_builder():
    file_path = r'e:\Projects\SPORTS\frontend\components\ResumeBuilder.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split the file so we only replace colors inside the 'my-preview-container'
    parts = content.split('my-preview-container">')
    if len(parts) != 2:
        print("Could not find my-preview-container")
        return

    top, preview = parts

    # Replacements for Tailwind neutral colors -> inline hex strings
    # This prevents html2canvas from crashing on OKLCH CSS functions
    color_map = {
        'bg-white': 'bg-[#ffffff]',
        'text-neutral-900': 'text-[#171717]',
        'border-neutral-900': 'border-[#171717]',
        'text-neutral-800': 'text-[#262626]',
        'text-neutral-700': 'text-[#404040]',
        'text-neutral-600': 'text-[#525252]',
        'text-neutral-500': 'text-[#737373]'
    }

    for tailwind_cls, hex_cls in color_map.items():
        preview = preview.replace(tailwind_cls, hex_cls)

    new_content = top + 'my-preview-container">' + preview

    # Now add the handleDownloadPdf function
    is_down_pdf_state = "const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);"
    if "isDownloadingPdf" not in new_content:
        new_content = new_content.replace(
            "const [isDownloading, setIsDownloading] = useState(false);",
            "const [isDownloading, setIsDownloading] = useState(false);\n    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);"
        )

    pdf_func = """    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            // @ts-ignore
            const html2pdf = (await import("html2pdf.js")).default;
            const element = printRef.current;
            if (!element) return;

            // Temporarily hide shadow to prevent it rendering in PDF
            element.classList.remove('shadow-2xl');

            const opt = {
                margin: 0,
                filename: `${(resumeData?.fullName || "Tailored_Resume").replace(/\\s+/g, "_")}.pdf`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            
            // Restore shadow
            element.classList.add('shadow-2xl');
        } catch (e) {
            console.error("Failed to generate PDF", e);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleDownloadDocx ="""
    
    new_content = new_content.replace("    const handleDownloadDocx =", pdf_func)

    # Update the PDF button to use the new function
    button_search = r'<button\s*onClick=\{\(\) => window\.print\(\)\}\s*className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"\s*>\s*<Printer className="w-3\.5 h-3\.5" />\s*Download PDF\s*</button>'
    
    button_replace = """<button
                                        onClick={handleDownloadPdf}
                                        disabled={isDownloadingPdf}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                                        {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
                                    </button>"""
    
    new_content = re.sub(button_search, button_replace, new_content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("PDF Download implemented successfully without OKLCH!")

if __name__ == "__main__":
    update_resume_builder()
