from database import get_supabase
sb = get_supabase()

print("--- Resume History ---")
print(sb.table('tailored_resumes').select('id, user_id').limit(5).execute().data)

print("--- Prep History ---")
print(sb.table('prep_sessions').select('id, user_id').limit(5).execute().data)

print("--- Bookmarks ---")
print(sb.table('user_bookmarks').select('user_id').limit(5).execute().data)
