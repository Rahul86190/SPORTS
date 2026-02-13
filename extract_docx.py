from docx import Document
import sys

def extract_text(docx_path):
    try:
        doc = Document(docx_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    docx_path = "e:/Projects/SPORTS/SPORTS(Updated).docx"
    print(f"--- {docx_path} ---")
    print(extract_text(docx_path))
    
    docx_path2 = "e:/Projects/SPORTS/SPORTS.docx"
    print(f"\n--- {docx_path2} ---")
    print(extract_text(docx_path2))
