from docx import Document
import sys
import os

def extract_text(docx_path, output_path):
    try:
        doc = Document(docx_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Successfully wrote to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    docx_path = r"e:\Projects\SPORTS\SPORTS(Updated).docx"
    output_path = r"e:\Projects\SPORTS\project_synopsis.txt"
    extract_text(docx_path, output_path)
