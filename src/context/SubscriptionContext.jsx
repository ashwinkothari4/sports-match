import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../services/supabase'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const SubscriptionContext = createContext({})

export const useSubscriptionContext = () => useContext(SubscriptionContext)

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [billingPortalUrl, setBillingPortalUrl] = useState(null)

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
        .select('subscription_tier, stripe_customer_id, stripe_subscription_id')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      setSubscription({
        tier: userData.subscription_tier || 'free',
        stripeCustomerId: userData.stripe_customer_id,
        stripeSubscriptionId: userData.stripe_subscription_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // If user has Stripe customer, load invoices
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

  const loadInvoices = async (stripeCustomerId) => {
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'get_invoices',
          customerId: stripeCustomerId
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
    const subscription = supabase
      .channel('user_subscription_updates')
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
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const upgradeSubscription = async (priceId) => {
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
  }

  const cancelSubscription = async () => {
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

      return { success: true, message: 'Subscription cancelled successfully' }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getBillingPortal = async () => {
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
  }

  const refreshSubscription = async () => {
    await loadSubscriptionData()
  }

  const getTierFeatures = (tier) => {
    const features = {
      free: {
        name: 'Free',
        price: '$0/month',
        description: 'Basic features to get started',
        limits: {
          maxMatchesPerMonth: 0,
          canCreateMatches: false,
          advancedMatchmaking: false,
          weatherAlerts: false,
          matchReminders: false,
          analytics: false,
          prioritySupport: false
        },
        color: 'gray'
      },
      play_plus: {
        name: 'Play+',
        price: '$9.99/month',
        description: 'Perfect for regular players',
        limits: {
          maxMatchesPerMonth: 20,
          canCreateMatches: true,
          advancedMatchmaking: true,
          weatherAlerts: true,
          matchReminders: true,
          analytics: false,
          prioritySupport: false
        },
        color: 'blue'
      },
      elite: {
        name: 'Elite',
        price: '$19.99/month',
        description: 'For serious competitors',
        limits: {
          maxMatchesPerMonth: 50,
          canCreateMatches: true,
          advancedMatchmaking: true,
          weatherAlerts: true,
          matchReminders: true,
          analytics: true,
          prioritySupport: true
        },
        color: 'purple'
      }
    }

    return features[tier] || features.free
  }

  const getCurrentUsage = () => {
    if (!user || subscription?.tier === 'free') {
      return {
        matchesCreated: 0,
        matchesPlayed: 0,
        usagePercentage: 0,
        remainingMatches: 0
      }
    }

    // In a real app, you would fetch actual usage data
    const tierFeatures = getTierFeatures(subscription.tier)
    const matchesCreated = 5 // Example data
    const usagePercentage = (matchesCreated / tierFeatures.limits.maxMatchesPerMonth) * 100

    return {
      matchesCreated,
      matchesPlayed: 8, // Example data
      usagePercentage: Math.min(usagePercentage, 100),
      remainingMatches: Math.max(tierFeatures.limits.maxMatchesPerMonth - matchesCreated, 0)
    }
  }

  const canCreateMatch = () => {
    if (!subscription) return false
    return subscription.tier !== 'free'
  }

  const getRemainingMatches = () => {
    if (!subscription || subscription.tier === 'free') return 0
    
    const usage = getCurrentUsage()
    return usage.remainingMatches
  }

  const isFeatureAvailable = (feature) => {
    if (!subscription) return false
    
    const tierFeatures = getTierFeatures(subscription.tier)
    return tierFeatures.limits[feature] || false
  }

  const value = {
    subscription,
    loading,
    upgrading,
    invoices,
    billingPortalUrl,
    upgradeSubscription,
    cancelSubscription,
    getBillingPortal,
    refreshSubscription,
    getTierFeatures,
    getCurrentUsage,
    canCreateMatch,
    getRemainingMatches,
    isFeatureAvailable
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}
