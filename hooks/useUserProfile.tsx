"use client"

import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

export interface UserProfile {
  username: string
  role: string
  bio: string
  profilePic: string
  displayName: string
  profileBanner: string
}

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchProfile = async () => {
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select(
            `username, role, bio, profile_pic, display_name, profile_banner`
          )
          .eq("id", userId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (data) {
          setProfile({
            username: data.username,
            role: data.role,
            bio: data.bio,
            profilePic: data.profile_pic,
            displayName: data.display_name,
            profileBanner: data.profile_banner,
          })
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  return { profile, loading, error }
}
