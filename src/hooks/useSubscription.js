import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../services/supabase'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const useSubscription = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [usage, setUsage] = useState(null)

  useEffect(() => {
    if (user) {
      loadSubscriptionData()
      setupRealtimeSubscription()
    } else {
      setSubscription(null)
      setLoading(false)
    }
  }, [user])

  const loadSubscriptionData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get user subscription data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_tier, stripe_customer_id, stripe_subscription_id, created_at')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      const subscriptionData = {
        tier: userData.subscription_tier || 'free',
        stripeCustomerId: userData.stripe_customer_id,
        stripeSubscriptionId: userData.stripe_subscription_id,
        createdAt: userData.created_at,
        updatedAt: new Date().toISOString()
      }

      setSubscription(subscriptionData)

      // Load usage data if subscribed
      if (userData.subscription_tier !== 'free') {
        await loadUsageData()
      }

      // Load invoices if customer exists
      if (userData.stripe_customer_id) {
        await loadInvoices(userData.stripe_customer_id)
      }

    } catch (error) {
      console.error('Error loading subscription data:', error)
      // Set default subscription on error
      setSubscription({
        tier: 'free',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUsageData = async () => {
    if (!user) return

    try {
      // Get current month's matches created by user
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, created_at')
        .eq('creator_id', user.id)
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString())

      if (error) throw error

      const tierLimits = getTierLimits(subscription?.tier || 'free')
      const matchesCreated = matches?.length || 0
      const usagePercentage = tierLimits.maxMatches > 0 
        ? (matchesCreated / tierLimits.maxMatches) * 100 
        : 0

      setUsage({
        matchesCreated,
        matchesPlayed: 0, // Would need separate query for matches participated in
        usagePercentage: Math.min(usagePercentage, 100),
        remainingMatches: Math.max(tierLimits.maxMatches - matchesCreated, 0),
        period: {
          start: firstDayOfMonth.toISOString(),
          end: lastDayOfMonth.toISOString()
        }
      })
    } catch (error) {
      console.error('Error loading usage data:', error)
    }
  }

  const loadInvoices = async (customerId) => {
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'get_invoices',
          customerId
        }
      })

      if (!error && data) {
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    // Subscribe to user updates for subscription changes
    const subscriptionChannel = supabase
      .channel(`user_subscription_${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users',
          filter: `id=eq.${user.id}`
        }, 
        (payload) => {
          if (payload.new.subscription_tier !== subscription?.tier) {
            setSubscription(prev => ({
              ...prev,
              tier: payload.new.subscription_tier,
              stripeSubscriptionId: payload.new.stripe_subscription_id,
              updatedAt: new Date().toISOString()
            }))
            
            // Reload usage data if tier changed
            if (payload.new.subscription_tier !== prev?.tier) {
              loadUsageData()
            }
          }
        }
      )
      .subscribe()

    return () => {
      subscriptionChannel.unsubscribe()
    }
  }

  const upgradeSubscription = useCallback(async (priceId) => {
    if (!user) {
      throw new Error('You must be logged in to upgrade')
    }

    setUpgrading(true)
    try {
      const successUrl = `${window.location.origin}/profile?upgrade=success`
      const cancelUrl = `${window.location.origin}/profile?upgrade=cancelled`

      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          userId: user.id,
          priceId,
          successUrl,
          cancelUrl
        }
      })

      if (error) throw error

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (stripeError) throw stripeError

      return { success: true }
    } catch (error) {
      console.error('Upgrade error:', error)
      throw error
    } finally {
      setUpgrading(false)
    }
  }, [user])

  const cancelSubscription = useCallback(async () => {
    if (!user || !subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription to cancel')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'cancel_subscription',
          subscriptionId: subscription.stripeSubscriptionId
        }
      })

      if (error) throw error

      // Update local state
      setSubscription(prev => ({
        ...prev,
        tier: 'free',
        stripeSubscriptionId: null,
        updatedAt: new Date().toISOString()
      }))

      // Clear usage data
      setUsage(null)

      return { success: true, message: 'Subscription cancelled successfully' }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [user, subscription])

  const getBillingPortal = useCallback(async () => {
    if (!user || !subscription?.stripeCustomerId) {
      throw new Error('No billing portal available')
    }

    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'create_portal_session',
          customerId: subscription.stripeCustomerId,
          returnUrl: `${window.location.origin}/profile`
        }
      })

      if (error) throw error

      return data.url
    } catch (error) {
      console.error('Get billing portal error:', error)
      throw error
    }
  }, [user, subscription])

  const refreshSubscription = useCallback(async () => {
    await loadSubscriptionData()
  }, [])

  const getTierFeatures = useCallback((tier = subscription?.tier) => {
    const features = {
      free: {
        name: 'Free',
        price: '$0/month',
        description: 'Basic features to get started',
        icon: '🆓',
        color: 'gray',
        features: [
          'Browse matches and players',
          'View leaderboard',
          'Basic profile',
          'Limited court discovery'
        ],
        limitations: [
          'Cannot create matches',
          'No match reminders',
          'Basic statistics only'
        ]
      },
      play_plus: {
        name: 'Play+',
        price: '$9.99/month',
        description: 'Perfect for regular players',
        icon: '⭐',
        color: 'blue',
        features: [
          'Create unlimited matches',
          'Advanced matchmaking',
          'Priority in search results',
          'Weather alerts',
          'Match reminders',
          'Basic analytics'
        ],
        limitations: [
          'Limited to 20 matches per month',
          'Standard support'
        ]
      },
      elite: {
        name: 'Elite',
        price: '$19.99/month',
        description: 'For serious competitors',
        icon: '👑',
        color: 'purple',
        features: [
          'Everything in Play+',
          'ELO history & analytics',
          'Advanced statistics',
          'Early access to features',
          'Premium support',
          'Custom achievements'
        ],
        limitations: [
          'Limited to 50 matches per month'
        ]
      }
    }

    return features[tier] || features.free
  }, [subscription])

  const getTierLimits = useCallback((tier = subscription?.tier) => {
    const limits = {
      free: {
        maxMatches: 0,
        canCreateMatches: false,
        advancedMatchmaking: false,
        weatherAlerts: false,
        matchReminders: false,
        analytics: false,
        prioritySupport: false
      },
      play_plus: {
        maxMatches: 20,
        canCreateMatches: true,
        advancedMatchmaking: true,
        weatherAlerts: true,
        matchReminders: true,
        analytics: false,
        prioritySupport: false
      },
      elite: {
        maxMatches: 50,
        canCreateMatches: true,
        advancedMatchmaking: true,
        weatherAlerts: true,
        matchReminders: true,
        analytics: true,
        prioritySupport: true
      }
    }

    return limits[tier] || limits.free
  }, [subscription])

  const canCreateMatch = useCallback(() => {
    if (!subscription) return false
    const limits = getTierLimits(subscription.tier)
    return limits.canCreateMatches && (limits.maxMatches === 0 || (usage?.remainingMatches || 0) > 0)
  }, [subscription, usage])

  const isFeatureAvailable = useCallback((feature) => {
    if (!subscription) return false
    const limits = getTierLimits(subscription.tier)
    return limits[feature] || false
  }, [subscription])

  const getRemainingMatches = useCallback(() => {
    if (!subscription || subscription.tier === 'free') return 0
    return usage?.remainingMatches || 0
  }, [subscription, usage])

  const getCurrentTier = useCallback(() => {
    if (!subscription) return 'free'
    return subscription.tier
  }, [subscription])

  const getUpgradePriceId = useCallback((tier) => {
    const priceIds = {
      play_plus: import.meta.env.VITE_STRIPE_PLAY_PLUS_PRICE_ID,
      elite: import.meta.env.VITE_STRIPE_ELITE_PRICE_ID
    }
    return priceIds[tier]
  }, [])

  const value = {
    // State
    subscription,
    loading,
    upgrading,
    invoices,
    usage,
    
    // Actions
    upgradeSubscription,
    cancelSubscription,
    getBillingPortal,
    refreshSubscription,
    
    // Getters
    getTierFeatures,
    getTierLimits,
    getCurrentTier,
    getUpgradePriceId,
    canCreateMatch,
    isFeatureAvailable,
    getRemainingMatches,
    
    // Computed
    tierFeatures: getTierFeatures(),
    tierLimits: getTierLimits(),
    currentTier: getCurrentTier(),
    canUpgrade: subscription?.tier !== 'elite'
  }

  return value
}
