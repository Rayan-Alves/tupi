import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://cvsoubcucolcvizysnje.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c291YmN1Y29sY3ZpenlzbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTQ0MjYsImV4cCI6MjA5MzU3MDQyNn0.e5d7utfxZtXdk1uupmH-Kc2rjBOGI9imAKQDB_ryen4',
)
