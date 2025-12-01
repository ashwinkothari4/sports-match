import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useRealtime = (channel, event, callback) => {
  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public' }, callback)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [channel, event, callback])
}

export const useRealtimeMatches = (userId) => {
  const [matches, setMatches] = useState([])

  useEffect(() => {
    const subscription = supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `or(creator_id.eq.${userId},opponent_id.eq.${userId})`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMatches(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setMatches(prev => prev.map(match => 
              match.id === payload.new.id ? payload.new : match
            ))
          } else if (payload.eventType === 'DELETE') {
            setMatches(prev => prev.filter(match => match.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return matches
}
