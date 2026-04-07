import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rwagjbkvxkdwqmouagad.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3YWdqYmt2eGtkd3Ftb3VhZ2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDMzMDAsImV4cCI6MjA5MTA3OTMwMH0.R5sZ1IZ2SZ4zThMuuz2ASE0-wZSHW0ELe8H-BnYING0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => true;
