import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useSubscription } from './useSubscription'
import { matchAPI } from '../services/api'
import { supabase } from '../services/supabase'

export const useMatchmaking = () => {
  const { user, profile } = useAuth()
  const { canCreateMatch, subscriptionTier } = useSubscription()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeMatches, setActiveMatches] = useState([])

  const findOpponents = useCallback(async (preferences) => {
    if (!user) {
      setError('You must be logged in to find opponents')
      return { success: false, error: 'Not authenticated' }
    }

    if (!canCreateMatch()) {
      setError('Upgrade your subscription to create matches')
      return { success: false, error: 'Subscription required' }
    }

    setLoading(true)
    setError(null)

    try {
      const requestData = {
        userId: user.id,
        sport: 'basketball',
        location: preferences.location,
        schedule: preferences.schedule,
        playstyle: preferences.playstyle || profile?.playstyle || 'casual',
        radius: preferences.radius || 10
      }

      const { data, error: apiError } = await matchAPI.findOpponents(requestData)
      
      if (apiError) throw apiError

      if (data?.success) {
        setSuggestions(data.opponents || [])
        return { success: true, opponents: data.opponents }
      } else {
        throw new Error('Failed to find opponents')
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while finding opponents'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user, profile, canCreateMatch])

  const createMatch = useCallback(async (opponent, matchDetails) => {
    if (!user) {
      setError('You must be logged in to create a match')
      return { success: false, error: 'Not authenticated' }
    }

    if (!canCreateMatch()) {
      setError('Upgrade your subscription to create matches')
      return { success: false, error: 'Subscription required' }
    }

    setLoading(true)
    setError(null)

    try {
      const matchData = {
        creator_id: user.id,
        opponent_id: opponent.user?.id || opponent.id,
        court_id: matchDetails.courtId,
        scheduled_time: matchDetails.schedule,
        midpoint_location: matchDetails.midpoint 
          ? `POINT(${matchDetails.midpoint.longitude} ${matchDetails.midpoint.latitude})`
          : null,
        status: 'scheduled',
        sport: 'basketball',
        match_score: {}
      }

      const { data: match, error: createError } = await matchAPI.createMatch(matchData)
      
      if (createError) throw createError

      // Add to active matches
      setActiveMatches(prev => [match, ...prev])

      return { success: true, match }
    } catch (err) {
      const errorMessage = err.message || 'Failed to create match'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user, canCreateMatch])

  const getActiveMatches = useCallback(async () => {
    if (!user) return []

    try {
      const { data, error } = await matchAPI.getMatches()
      
      if (error) throw error

      const userMatches = (data || []).filter(match => 
        (match.creator_id === user.id || match.opponent_id === user.id) &&
        ['scheduled', 'in_progress'].includes(match.status)
      )

      setActiveMatches(userMatches)
      return userMatches
    } catch (err) {
      console.error('Error getting active matches:', err)
      return []
    }
  }, [user])

  const loadMatchDetails = useCallback(async (matchId) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          creator:users!matches_creator_id_fkey(*),
          opponent:users!matches_opponent_id_fkey(*),
          court:courts(*)
        `)
        .eq('id', matchId)
        .single()

      if (error) throw error
      return { success: true, match: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const updateMatchStatus = useCallback(async (matchId, status, scores = null) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    setLoading(true)
    try {
      const updates = { status }
      if (scores) {
        updates.match_score = scores
      }

      const { data, error } = await matchAPI.updateMatch(matchId, updates)
      
      if (error) throw error

      // Update active matches list
      if (status === 'completed' || status === 'expired') {
        setActiveMatches(prev => prev.filter(match => match.id !== matchId))
      }

      return { success: true, match: data }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [user])

  const completeMatch = useCallback(async (matchId, scores) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    setLoading(true)
    try {
      // First update the match with scores
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          match_score: scores
        })
        .eq('id', matchId)

      if (updateError) throw updateError

      // Then call the complete_match edge function
      const { data, error: completeError } = await supabase.functions.invoke('complete_match', {
        body: {
          matchId,
          creatorScore: scores.creator,
          opponentScore: scores.opponent
        }
      })

      if (completeError) throw completeError

      // Update active matches
      setActiveMatches(prev => prev.filter(match => match.id !== matchId))

      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [user])

  const cancelMatch = useCallback(async (matchId) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    setLoading(true)
    try {
      const { data, error } = await matchAPI.updateMatch(matchId, { status: 'expired' })
      
      if (error) throw error

      // Remove from active matches
      setActiveMatches(prev => prev.filter(match => match.id !== matchId))

      return { success: true, match: data }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [user])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Calculate match statistics
  const getMatchStats = useCallback(() => {
    if (!activeMatches.length) return null

    const stats = {
      total: activeMatches.length,
      scheduled: activeMatches.filter(m => m.status === 'scheduled').length,
      inProgress: activeMatches.filter(m => m.status === 'in_progress').length,
      upcoming: activeMatches.filter(m => 
        m.status === 'scheduled' && 
        new Date(m.scheduled_time) > new Date()
      ).length
    }

    return stats
  }, [activeMatches])

  return {
    // State
    suggestions,
    loading,
    error,
    activeMatches,
    matchStats: getMatchStats(),
    
    // Actions
    findOpponents,
    createMatch,
    getActiveMatches,
    loadMatchDetails,
    updateMatchStatus,
    completeMatch,
    cancelMatch,
    clearSuggestions,
    clearError,
    
    // Capabilities
    canCreateMatch,
    subscriptionTier,
    
    // Helper functions
    refreshMatches: getActiveMatches
  }
}
