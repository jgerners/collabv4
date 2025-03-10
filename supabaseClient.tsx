// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Vervang deze waarden door jouw Supabase project details:
const SUPABASE_URL = 'https://tjdqekniodsylvelqsyv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZHFla25pb2RzeWx2ZWxxc3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMzQ2MDUsImV4cCI6MjA1NjYxMDYwNX0.WXuKGQ8sSKITjFsRGb9sCbqr5HXZ-D3oNYFVvHGRvTY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
