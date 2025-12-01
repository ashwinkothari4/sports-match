import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { userAPI, achievementsAPI, matchAPI } from '../services/api'
import AvatarUploader from '../components/AvatarUploader'
import BadgeList from '../components/BadgeList'
import UpgradeModal from '../components/UpgradeModal'
import { getELOTier } from '../utils/elo'
import { Edit3, Trophy, Users, Target, Award } from 'lucide-react'

const Profile = () => {
  const { user: authUser } = useAuth()
  const { subscription, canCreateMatch } = useSubscription(authUser?.id)
  const [user, setUser] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [earnedAchievements, setEarnedAchievements] = useState([])
  const [matchHistory, setMatchHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    if (authUser) {
      loadProfileData()
    }
  }, [authUser])

  const loadProfileData = async () => {
    setLoading(true)
    try {
      // Load user profile
      const { data: userData } = await userAPI.getProfile(authUser.id)
      setUser(userData)
      setFormData(userData)

      // Load achievements
      const { data: achievementsData } = await achievementsAPI.getAchievements()
      setAchievements(achievementsData || [])

      // Load earned achievements
      const { data: earnedData } = await achievementsAPI.getUserAchievements(authUser.id)
      setEarnedAchievements(earnedData || [])

      // Load recent match history
      const { data: matchesData } = await matchAPI.getMatches('completed')
      setMatchHistory(matchesData?.slice(0, 10) || [])

    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await userAPI.updateProfile(authUser.id, formData)
      setUser(formData)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleAvatarUpdate = (avatarUrl) => {
    setUser(prev => ({ ...prev, avatar_url: avatarUrl }))
    setFormData(prev => ({ ...prev, avatar_url: avatarUrl }))
  }

  const eloTier = user ? getELOTier(user.elo) : { name: 'Rookie', color: 'text-blue-600' }
  const winRate = user && user.total_matches > 0 
    ? ((user.wins / user.total_matches) * 100).toFixed(1) 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Profile not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-6">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <AvatarUploader
                userId={user.id}
                currentAvatar={user.avatar_url}
                onAvatarUpdate={handleAvatarUpdate}
                size="xl"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`text-lg font-semibold ${eloTier.color}`}>
                      {eloTier.name}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ELO: {user.elo}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{user.total_matches}</div>
                  <div className="text-sm text-gray-600">Total Matches</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{user.wins}</div>
                  <div className="text-sm text-gray-600">Wins</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{user.losses}</div>
                  <div className="text-sm text-gray-600">Losses</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{winRate}%</div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {subscription?.subscription_tier === 'free' ? 'Free Plan' :
                     subscription?.subscription_tier === 'play_plus' ? 'Play+ Plan' : 'Elite Plan'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subscription?.subscription_tier === 'free' 
                      ? 'Upgrade to create matches and access premium features'
                      : 'Full access to all matchmaking features'
                    }
                  </p>
                </div>
                {subscription?.subscription_tier === 'free' && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-medium"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playstyle
                </label>
                <select
                  value={formData.playstyle || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, playstyle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select playstyle</option>
                  <option value="competitive">Competitive</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <textarea
                  value={formData.availability ? JSON.stringify(formData.availability) : ''}
                  onChange={(e) => {
                    try {
                      const availability = JSON.parse(e.target.value)
                      setFormData(prev => ({ ...prev, availability }))
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"weekdays": ["evening"], "weekends": ["morning", "afternoon"]}'
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter your availability as JSON format
                </p>
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={handleSaveProfile}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 font-medium"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {earnedAchievements.length} / {achievements.length}
            </span>
          </div>
          <BadgeList
            achievements={achievements}
            earnedAchievements={earnedAchievements}
          />
        </div>

        {/* Recent Match History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="h-6 w-6 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Matches</h2>
          </div>
          {matchHistory.length > 0 ? (
            <div className="space-y-4">
              {matchHistory.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {match.creator.username}
                      </div>
                      <div className="text-lg font-bold text-primary-600">
                        {match.match_score?.creator || '-'}
                      </div>
                    </div>
                    <div className="text-gray-400">vs</div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {match.opponent.username}
                      </div>
                      <div className="text-lg font-bold text-primary-600">
                        {match.match_score?.opponent || '-'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {new Date(match.scheduled_time).toLocaleDateString()}
                    </div>
                    <div className={`text-sm font-medium ${
                      (match.creator_id === user.id && match.match_score?.creator > match.match_score?.opponent) ||
                      (match.opponent_id === user.id && match.match_score?.opponent > match.match_score?.creator)
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(match.creator_id === user.id && match.match_score?.creator > match.match_score?.opponent) ||
                       (match.opponent_id === user.id && match.match_score?.opponent > match.match_score?.creator)
                        ? 'Win' : 'Loss'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No match history
              </h3>
              <p className="text-gray-600">
                Play some matches to see your history here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  )
}

export default Profile
