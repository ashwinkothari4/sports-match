import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { userAPI } from '../services/api'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await userAPI.getProfile(userId)
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = useCallback(async (email, password, userData) => {
    setAuthError(null)
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            playstyle: userData.playstyle
          },
          emailRedirectTo: `${window.location.origin}/login?verified=true`
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            username: userData.username,
            playstyle: userData.playstyle,
            elo: 1200,
            subscription_tier: 'free'
          })

        if (profileError) throw profileError
      }

      return { success: true, data }
    } catch (error) {
      setAuthError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    setAuthError(null)
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        setUser(data.user)
        await loadUserProfile(data.user.id)
      }

      return { success: true, data }
    } catch (error) {
      setAuthError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null)
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      setAuthError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setAuthError(null)
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      return { success: true }
    } catch (error) {
      setAuthError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email) => {
    setAuthError(null)
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      setAuthError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePassword = useCallback(async (newPassword) => {
    setAuthError(null)
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      setAuthError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' }
    
    setLoading(true)
    try {
      const { data, error } = await userAPI.updateProfile(user.id, updates)
      
      if (error) throw error
      
      setProfile(prev => ({ ...prev, ...updates }))
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [user])

  const uploadAvatar = useCallback(async (file) => {
    if (!user) return { success: false, error: 'Not authenticated' }
    
    setLoading(true)
    try {
      const avatarUrl = await userAPI.uploadAvatar(user.id, file)
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }))
      return { success: true, avatarUrl }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadUserProfile(user.id)
  }, [user])

  return {
    user,
    profile,
    loading,
    error: authError,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    refreshProfile,
    clearError: () => setAuthError(null)
  }
}
