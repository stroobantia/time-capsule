import { createClient } from '@supabase/supabase-js'

// 只能在伺服器端(API route)使用，金鑰不會出現在網頁裡
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)