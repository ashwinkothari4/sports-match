import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { matchAPI, courtAPI } from '../services/api'
import MatchSuggestionsModal from './MatchSuggestionsModal'
import UpgradeModal from '../components/UpgradeModal'
import CourtCard from '../components/CourtCard'
import { MapPin, Calendar, Users, Search } from 'lucide-react'

const FindMatch = () => {
  const { user } = useAuth()
  const { subscription, canCreateMatch } = useSubscription(user?.id)
  const [courts, setCourts] = useState([])
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [schedule, setSchedule] = useState('')
  const [playstyle, setPlaystyle] = useState('competitive')
  const [radius, setRadius] = useState(10)
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    loadCourts()
  }, [])

  const loadCourts = async () => {
    const { data } = await courtAPI.getCourts()
    setCourts(data || [])
  }

  const handleFindMatch = async () => {
    if (!canCreateMatch()) {
      setShowUpgradeModal(true)
      return
    }

    setLoading(true)
    
    try {
      const requestData = {
        userId: user.id,
        sport: 'basketball',
        location: {
          latitude: selectedCourt?.latitude || 40.7128,
          longitude: selectedCourt?.longitude || -74.0060
        },
        schedule,
        playstyle,
        radius
      }

      const { data } = await matchAPI.findOpponents(requestData)
      
      if (data.success) {
        setSuggestions(data.opponents)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error finding match:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMatch = async (opponent, midpoint) => {
    try {
      const matchData = {
        creator_id: user.id,
        opponent_id: opponent.user.id,
        court_id: selectedCourt?.id,
        scheduled_time: schedule,
        midpoint_location: `POINT(${midpoint.longitude} ${midpoint.latitude})`,
        status: 'scheduled'
      }

      const { data, error } = await matchAPI.createMatch(matchData)
      
      if (error) throw error

      setShowSuggestions(false)
      // Show success message
      alert('Match created successfully!')
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Failed to create match. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Find a Match</h1>

          {/* Match Preferences */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Court
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courts.map((court) => (
                  <CourtCard
                    key={court.id}
                    court={court}
                    selected={selectedCourt?.id === court.id}
                    onSelect={setSelectedCourt}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <input
                type="datetime-local"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Playstyle
              </label>
              <select
                value={playstyle}
                onChange={(e) => setPlaystyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="competitive">Competitive</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius: {radius} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleFindMatch}
            disabled={loading || !schedule}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Search className="h-5 w-5" />
            )}
            <span>{loading ? 'Finding Matches...' : 'Find Opponents'}</span>
          </button>

          {/* Subscription Info */}
          {!canCreateMatch() && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                Free users can only browse matches. Upgrade to create matches and play with opponents.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSuggestions && (
        <MatchSuggestionsModal
          suggestions={suggestions}
          onSelect={handleCreateMatch}
          onClose={() => setShowSuggestions(false)}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  )
}

export default FindMatch
