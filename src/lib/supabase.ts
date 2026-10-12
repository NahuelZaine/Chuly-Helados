/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Clean URL in case it includes /rest/v1 or trailing slashes
const rawUrl = (import.meta.env?.VITE_SUPABASE_URL || 'https://zsirhvqjatpjulyllwtb.supabase.co') as string;
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
export const SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7YHCwaOUm9l56fAL2q5JBQ_kai71ofu') as string;
export const SUPABASE_PROJECT_ID = (import.meta.env?.VITE_SUPABASE_PROJECT_ID || 'zsirhvqjatpjulyllwtb') as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
