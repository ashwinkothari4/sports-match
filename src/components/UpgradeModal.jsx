import React, { useState } from 'react'
import { X, Check, Star, Crown } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../services/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const UpgradeModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false)

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Basic features to get started',
      features: [
        'Browse matches and players',
        'View leaderboard',
        'Basic profile',
        'Limited court discovery'
      ],
      buttonText: 'Current Plan',
      disabled: true,
      popular: false
    },
    {
      name: 'Play+',
      price: '$9.99',
      description: 'Perfect for regular players',
      features: [
        'Create unlimited matches',
        'Advanced matchmaking',
        'Priority in search results',
        'Weather alerts',
        'Match reminders'
      ],
      priceId: import.meta.env.VITE_STRIPE_PLAY_PLUS_PRICE_ID,
      buttonText: 'Upgrade to Play+',
      popular: true
    },
    {
      name: 'Elite',
      price: '$19.99',
      description: 'For serious competitors',
      features: [
        'Everything in Play+',
        'ELO history & analytics',
        'Advanced statistics',
        'Early access to features',
        'Premium support',
        'Custom achievements'
      ],
      priceId: import.meta.env.VITE_STRIPE_ELITE_PRICE_ID,
      buttonText: 'Upgrade to Elite',
      popular: false
    }
  ]

  const handleUpgrade = async (priceId) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          userId: user.id,
          priceId: priceId,
          successUrl: `${window.location.origin}/profile?upgrade=success`,
          cancelUrl: `${window.location.origin}/profile?upgrade=cancelled`
        }
      })

      if (error) throw error

      const stripe = await stripePromise
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (stripeError) throw stripeError
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to start upgrade process. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Experience</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative border rounded-lg p-6 ${
                  plan.popular
                    ? 'border-primary-500 ring-2 ring-primary-500'
                    : 'border-gray-200'
                } ${plan.disabled ? 'opacity-75' : 'hover:shadow-lg transition-shadow'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>Most Popular</span>
                    </span>
                  </div>
                )}

                {plan.name === 'Elite' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Crown className="h-3 w-3" />
                      <span>Premium</span>
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== '$0' && <span className="text-gray-600">/month</span>}
                  </div>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
                  disabled={plan.disabled || loading}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    plan.disabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading ? 'Processing...' : plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>All plans include our core matchmaking features. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal
