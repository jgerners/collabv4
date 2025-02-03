import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ccnmwozuntvahhlltlgy.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbm13b3p1bnR2YWhobGx0bGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNzQ3MDMsImV4cCI6MjA1Mzc1MDcwM30.kUw8zp238QgfkazjkyPJk6z2yV9wmIyUyCS64sSURwQ"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})