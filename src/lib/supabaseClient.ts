import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mfzyyadnsfxgcbnjfckx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1menl5YWRuc2Z4Z2NibmpmY2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MTczMzMsImV4cCI6MjA0ODM5MzMzM30.CNgkq6pgEnv2C4a4GS7YfNBldxUxv1L0dX2iMKqyscY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 