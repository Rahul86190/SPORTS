import re

with open(r'e:\\Projects\\SPORTS\\frontend\\components\\ResumeBuilder.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the invalid tabStops from the style definition
content = re.sub(r'\s*tabStops:\s*\[\{ type: TabStopType\.RIGHT,\s*position:\s*10000 \}\],\s*//.*', '', content)

# Change .filter(Boolean) to .filter((x) => x !== null) as any[]  where applicable inside handleDownloadDocx
# Alternatively simply .filter(Boolean) to .filter(Boolean) as any[]
content = content.replace('.filter(Boolean)', '.filter(Boolean) as any[]')
content = content.replace('.filter(Boolean) as any[] as any[]', '.filter(Boolean) as any[]')

with open(r'e:\\Projects\\SPORTS\\frontend\\components\\ResumeBuilder.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated TS Fixes successfully")
