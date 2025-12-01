import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const stripeService = {
  // Initialize Stripe instance
  async getStripe() {
    return await stripePromise
  },

  // Create a checkout session for subscription upgrade
  async createCheckoutSession(priceId, userId) {
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          userId,
          priceId,
          successUrl: `${window.location.origin}/profile?upgrade=success`,
          cancelUrl: `${window.location.origin}/profile?upgrade=cancelled`
        }
      })

      if (error) throw error

      return { success: true, sessionId: data.sessionId }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { success: false, error: error.message }
    }
  },

  // Redirect to Stripe Checkout
  async redirectToCheckout(sessionId) {
    try {
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId
      })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error redirecting to checkout:', error)
      return { success: false, error: error.message }
    }
  },

  // Upgrade subscription (combines create session and redirect)
  async upgradeSubscription(priceId, userId) {
    try {
      // Create checkout session
      const { success, sessionId, error: sessionError } = await this.createCheckoutSession(priceId, userId)
      
      if (!success || !sessionId) {
        throw new Error(sessionError || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      const redirectResult = await this.redirectToCheckout(sessionId)
      
      if (!redirectResult.success) {
        throw new Error(redirectResult.error || 'Failed to redirect to checkout')
      }

      return { success: true }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      return { success: false, error: error.message }
    }
  },

  // Get billing portal URL for customer
  async getBillingPortalUrl(customerId) {
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'create_portal_session',
          customerId,
          returnUrl: `${window.location.origin}/profile`
        }
      })

      if (error) throw error

      return { success: true, url: data.url }
    } catch (error) {
      console.error('Error getting billing portal URL:', error)
      return { success: false, error: error.message }
    }
  },

  // Open billing portal
  async openBillingPortal(customerId) {
    try {
      const { success, url, error: portalError } = await this.getBillingPortalUrl(customerId)
      
      if (!success || !url) {
        throw new Error(portalError || 'Failed to get billing portal URL')
      }

      // Open portal in new tab
      window.open(url, '_blank', 'noopener,noreferrer')
      
      return { success: true }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      return { success: false, error: error.message }
    }
  },

  // Get subscription details (via backend)
  async getSubscriptionDetails(subscriptionId) {
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'get_subscription',
          subscriptionId
        }
      })

      if (error) throw error

      return { success: true, subscription: data.subscription }
    } catch (error) {
      console.error('Error getting subscription details:', error)
      return { success: false, error: error.message }
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'cancel_subscription',
          subscriptionId
        }
      })

      if (error) throw error

      return { success: true, message: 'Subscription cancelled successfully' }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      return { success: false, error: error.message }
    }
  },

  // Get invoices for customer
  async getInvoices(customerId) {
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'get_invoices',
          customerId
        }
      })

      if (error) throw error

      return { success: true, invoices: data.invoices || [] }
    } catch (error) {
      console.error('Error getting invoices:', error)
      return { success: false, error: error.message }
    }
  },

  // Verify Stripe is properly configured
  async verifyStripeConfiguration() {
    try {
      const stripe = await stripePromise
      
      if (!stripe) {
        return {
          success: false,
          error: 'Stripe failed to initialize. Check your publishable key.'
        }
      }

      // Check if we can create elements (light test)
      const elements = stripe.elements()
      
      return {
        success: true,
        message: 'Stripe is properly configured',
        stripeVersion: stripe._apiVersion
      }
    } catch (error) {
      return {
        success: false,
        error: `Stripe configuration error: ${error.message}`
      }
    }
  },

  // Create payment method (for future use with custom payment forms)
  async createPaymentMethod(cardElement) {
    try {
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (error) throw error

      return { success: true, paymentMethod }
    } catch (error) {
      console.error('Error creating payment method:', error)
      return { success: false, error: error.message }
    }
  },

  // Get price information (for display purposes)
  async getPriceInfo(priceId) {
    try {
      // Since we can't directly access Stripe from frontend,
      // we'll use our backend function
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'get_price',
          priceId
        }
      })

      if (error) throw error

      return { success: true, price: data.price }
    } catch (error) {
      console.error('Error getting price info:', error)
      return { success: false, error: error.message }
    }
  },

  // Get all available plans/prices
  async getAvailablePlans() {
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'get_plans'
        }
      })

      if (error) throw error

      // Map Stripe prices to our subscription tiers
      const plans = (data.prices || []).map(price => {
        let tier = 'unknown'
        let name = 'Unknown Plan'
        let description = ''

        // Map price IDs to our tiers
        if (price.id === import.meta.env.VITE_STRIPE_PLAY_PLUS_PRICE_ID) {
          tier = 'play_plus'
          name = 'Play+'
          description = 'Perfect for regular players'
        } else if (price.id === import.meta.env.VITE_STRIPE_ELITE_PRICE_ID) {
          tier = 'elite'
          name = 'Elite'
          description = 'For serious competitors'
        }

        return {
          id: price.id,
          tier,
          name,
          description,
          amount: price.unit_amount / 100, // Convert from cents
          currency: price.currency,
          interval: price.recurring?.interval || 'month',
          features: this.getTierFeatures(tier).features
        }
      })

      return { success: true, plans }
    } catch (error) {
      console.error('Error getting available plans:', error)
      return { success: false, error: error.message }
    }
  },

  // Helper: Get tier features
  getTierFeatures(tier) {
    const features = {
      free: {
        name: 'Free',
        price: '$0',
        features: [
          'Browse matches and players',
          'View leaderboard',
          'Basic profile',
          'Limited court discovery'
        ]
      },
      play_plus: {
        name: 'Play+',
        price: '$9.99',
        features: [
          'Create unlimited matches',
          'Advanced matchmaking',
          'Priority in search results',
          'Weather alerts',
          'Match reminders'
        ]
      },
      elite: {
        name: 'Elite',
        price: '$19.99',
        features: [
          'Everything in Play+',
          'ELO history & analytics',
          'Advanced statistics',
          'Early access to features',
          'Premium support',
          'Custom achievements'
        ]
      }
    }

    return features[tier] || features.free
  },

  // Handle Stripe redirect result
  async handleRedirectResult() {
    try {
      const stripe = await stripePromise
      
      if (!stripe) {
        return { success: false, error: 'Stripe not loaded' }
      }

      const result = await stripe.redirectToCheckout({
        // You would pass sessionId here if needed
      })

      if (result.error) {
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Check if user has an active subscription
  async checkSubscriptionStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier, stripe_subscription_id')
        .eq('id', userId)
        .single()

      if (error) throw error

      const hasActiveSubscription = data.subscription_tier !== 'free' && 
                                   data.stripe_subscription_id !== null

      return {
        success: true,
        hasActiveSubscription,
        tier: data.subscription_tier,
        subscriptionId: data.stripe_subscription_id
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return { success: false, error: error.message }
    }
  },

  // Format currency for display
  formatCurrency(amount, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount)
  },

  // Validate price ID
  isValidPriceId(priceId) {
    if (!priceId) return false
    
    const validPriceIds = [
      import.meta.env.VITE_STRIPE_PLAY_PLUS_PRICE_ID,
      import.meta.env.VITE_STRIPE_ELITE_PRICE_ID
    ].filter(Boolean) // Remove undefined values

    return validPriceIds.includes(priceId)
  }
}

// Export as default for easier imports
export default stripeService
