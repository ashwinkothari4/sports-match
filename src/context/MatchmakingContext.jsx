import React, { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { matchAPI } from '../services/api'
import { supabase } from '../services/supabase'

const MatchmakingContext = createContext({})

export const useMatchmaking = () => useContext(MatchmakingContext)

export const MatchmakingProvider = ({ children }) => {
  const { user } = useAuth()
  const { subscription, canCreateMatch } = useSubscription(user?.id)
  
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeMatch, setActiveMatch] = useState(null)

  // Find opponents based on preferences
  const findOpponents = useCallback(async (preferences) => {
    if (!user) {
      setError('You must be logged in to find opponents')
      return null
    }

    if (!canCreateMatch()) {
      setError('Upgrade your subscription to create matches')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const requestData = {
        userId: user.id,
        sport: 'basketball',
        location: preferences.location,
        schedule: preferences.schedule,
        playstyle: preferences.playstyle,
        radius: preferences.radius || 10
      }

      const { data, error: apiError } = await matchAPI.findOpponents(requestData)
      
      if (apiError) throw apiError

      if (data.success) {
        setSuggestions(data.opponents)
        return data.opponents
      } else {
        throw new Error('Failed to find opponents')
      }
    } catch (err) {
      setError(err.message)
      console.error('Matchmaking error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, canCreateMatch])

  // Create a match with selected opponent
  const createMatch = useCallback(async (opponent, matchDetails) => {
    if (!user) {
      setError('You must be logged in to create a match')
      return null
    }

    if (!canCreateMatch()) {
      setError('Upgrade your subscription to create matches')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const matchData = {
        creator_id: user.id,
        opponent_id: opponent.user.id,
        court_id: matchDetails.courtId,
        scheduled_time: matchDetails.schedule,
        midpoint_location: `POINT(${matchDetails.midpoint.longitude} ${matchDetails.midpoint.latitude})`,
        status: 'scheduled',
        sport: 'basketball'
      }

      const { data: match, error: createError } = await matchAPI.createMatch(matchData)
      
      if (createError) throw createError

      // Create notifications for both players
      const notifications = [
        {
          user_id: user.id,
          type: 'match_created',
          title: 'Match Created',
          message: `You scheduled a match with ${opponent.user.username} on ${new Date(matchDetails.schedule).toLocaleDateString()}`,
          metadata: { match_id: match.id, opponent: opponent.user }
        },
        {
          user_id: opponent.user.id,
          type: 'match_invitation',
          title: 'Match Invitation',
          message: `${user.username} wants to play a match with you on ${new Date(matchDetails.schedule).toLocaleDateString()}`,
          metadata: { match_id: match.id, creator: user }
        }
      ]

      await supabase
        .from('notifications')
        .insert(notifications)

      // Trigger realtime update
      await supabase.functions.invoke('realtime_notifier', {
        body: {
          channel: `matches:${match.id}`,
          event: 'match_created',
          payload: match
        }
      })

      setActiveMatch(match)
      return match
    } catch (err) {
      setError(err.message)
      console.error('Create match error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, canCreateMatch])

  // Accept a match invitation
  const acceptMatch = useCallback(async (matchId) => {
    if (!user) {
      setError('You must be logged in to accept matches')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError) throw fetchError

      if (match.opponent_id !== user.id) {
        throw new Error('You are not the invited opponent for this match')
      }

      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update({ status: 'scheduled' })
        .eq('id', matchId)
        .select()
        .single()

      if (updateError) throw updateError

      // Create notification for creator
      await supabase
        .from('notifications')
        .insert({
          user_id: match.creator_id,
          type: 'match_accepted',
          title: 'Match Accepted',
          message: `${user.username} accepted your match invitation`,
          metadata: { match_id: matchId }
        })

      // Trigger realtime update
      await supabase.functions.invoke('realtime_notifier', {
        body: {
          channel: `matches:${matchId}`,
          event: 'match_accepted',
          payload: updatedMatch
        }
      })

      return updatedMatch
    } catch (err) {
      setError(err.message)
      console.error('Accept match error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Decline a match invitation
  const declineMatch = useCallback(async (matchId) => {
    if (!user) {
      setError('You must be logged in to decline matches')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError) throw fetchError

      if (match.opponent_id !== user.id) {
        throw new Error('You are not the invited opponent for this match')
      }

      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update({ 
          status: 'expired',
          opponent_id: null // Remove opponent since they declined
        })
        .eq('id', matchId)
        .select()
        .single()

      if (updateError) throw updateError

      // Create notification for creator
      await supabase
        .from('notifications')
        .insert({
          user_id: match.creator_id,
          type: 'match_declined',
          title: 'Match Declined',
          message: `${user.username} declined your match invitation`,
          metadata: { match_id: matchId }
        })

      return updatedMatch
    } catch (err) {
      setError(err.message)
      console.error('Decline match error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Start a match
  const startMatch = useCallback(async (matchId) => {
    if (!user) {
      setError('You must be logged in to start matches')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError) throw fetchError

      if (match.creator_id !== user.id && match.opponent_id !== user.id) {
        throw new Error('You are not a participant in this match')
      }

      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update({ status: 'in_progress' })
        .eq('id', matchId)
        .select()
        .single()

      if (updateError) throw updateError

      // Trigger realtime update
      await supabase.functions.invoke('realtime_notifier', {
        body: {
          channel: `matches:${matchId}`,
          event: 'match_started',
          payload: updatedMatch
        }
      })

      return updatedMatch
    } catch (err) {
      setError(err.message)
      console.error('Start match error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Complete a match with scores
  const completeMatch = useCallback(async (matchId, scores) => {
    if (!user) {
      setError('You must be logged in to complete matches')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError) throw fetchError

      if (match.creator_id !== user.id && match.opponent_id !== user.id) {
        throw new Error('You are not a participant in this match')
      }

      // Update match with scores and status
      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          match_score: scores
        })
        .eq('id', matchId)
        .select()
        .single()

      if (updateError) throw updateError

      // Calculate ELO changes and update users via edge function
      const { data: eloResult, error: eloError } = await supabase.functions.invoke('complete_match', {
        body: {
          matchId,
          creatorScore: scores.creator,
          opponentScore: scores.opponent
        }
      })

      if (eloError) throw eloError

      // Trigger realtime update
      await supabase.functions.invoke('realtime_notifier', {
        body: {
          channel: `matches:${matchId}`,
          event: 'match_completed',
          payload: { match: updatedMatch, eloChanges: eloResult?.eloChange }
        }
      })

      // Also update leaderboard channel
      await supabase.functions.invoke('realtime_notifier', {
        body: {
          channel: 'leaderboard',
          event: 'leaderboard_updated',
          payload: { matchId, updatedAt: new Date().toISOString() }
        }
      })

      return { match: updatedMatch, eloChanges: eloResult?.eloChange }
    } catch (err) {
      setError(err.message)
      console.error('Complete match error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Cancel a match
  const cancelMatch = useCallback(async (matchId) => {
    if (!user) {
      setError('You must be logged in to cancel matches')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (fetchError) throw fetchError

      if (match.creator_id !== user.id) {
        throw new Error('Only the match creator can cancel the match')
      }

      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update({ status: 'expired' })
        .eq('id', matchId)
        .select()
        .single()

      if (updateError) throw updateError

      // Create notification for opponent
      if (match.opponent_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: match.opponent_id,
            type: 'match_cancelled',
            title: 'Match Cancelled',
            message: `${user.username} cancelled the scheduled match`,
            metadata: { match_id: matchId }
          })
      }

      // Trigger realtime update
      await supabase.functions.invoke('realtime_notifier', {
        body: {
          channel: `matches:${matchId}`,
          event: 'match_cancelled',
          payload: updatedMatch
        }
      })

      return updatedMatch
    } catch (err) {
      setError(err.message)
      console.error('Cancel match error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Get user's active matches
  const getActiveMatches = useCallback(async () => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          creator:users!matches_creator_id_fkey(*),
          opponent:users!matches_opponent_id_fkey(*),
          court:courts(*)
        `)
        .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_time', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Get active matches error:', err)
      return []
    }
  }, [user])

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setError(null)
  }, [])

  // Set active match
  const setActiveMatchHandler = useCallback((match) => {
    setActiveMatch(match)
  }, [])

  const value = {
    suggestions,
    loading,
    error,
    activeMatch,
    findOpponents,
    createMatch,
    acceptMatch,
    declineMatch,
    startMatch,
    completeMatch,
    cancelMatch,
    getActiveMatches,
    clearSuggestions,
    setActiveMatch: setActiveMatchHandler,
    canCreateMatch,
    subscriptionTier: subscription?.subscription_tier
  }

  return (
    <MatchmakingContext.Provider value={value}>
      {children}
    </MatchmakingContext.Provider>
  )
}
