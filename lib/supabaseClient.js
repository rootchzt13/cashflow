import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://scudysjrixenenukwmrf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdWR5c2pyaXhlbmVudWt3bXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODc0MTgsImV4cCI6MjA2NzY2MzQxOH0.T4mTgdRGgGjla40yFaS_43MnIkNVeubMHqmUSiHK0zg'

export const supabase = createClient(supabaseUrl, supabaseKey)
