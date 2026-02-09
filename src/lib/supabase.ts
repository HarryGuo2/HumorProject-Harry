import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Clean any potential whitespace/newlines from the environment variables
const cleanUrl = supabaseUrl?.trim()
const cleanKey = supabaseKey?.trim().replace(/\s+/g, '')

export const supabase = createClient(cleanUrl, cleanKey)