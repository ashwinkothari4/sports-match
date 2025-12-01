import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { friendsAPI, matchAPI } from '../services/api'
import PlayerCard from '../components/PlayerCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Users, UserPlus, Mail, Check, X } from 'lucide-react'

const Social = () => {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [recentPlayers, setRecentPlayers] = useState([])
  const [activeTab, setActiveTab] = useState('friends')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSocialData()
  }, [])

  const loadSocialData = async () => {
    setLoading(true)
    try {
      // Load friends
      const { data: friendsData } = await friendsAPI.getFriends(user.id)
      setFriends(friendsData || [])

      // Load pending requests
      const { data: pendingData } = await friendsAPI.getPendingRequests(user.id)
      setPendingRequests(pendingData || [])

      // Load recent opponents
      const { data: matchesData } = await matchAPI.getMatches()
      const recentOpponents = await getRecentOpponents(matchesData || [])
      setRecentPlayers(recentOpponents)

    } catch (error) {
      console.error('Error loading social data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecentOpponents = async (matches) => {
    const opponentIds = new Set()
    const opponents = []

    // Get unique opponents from recent matches
    for (const match of matches.slice(0, 20)) { // Last 20 matches
      const opponentId = match.creator_id === user.id ? match.opponent_id : match.creator_id
      if (!opponentIds.has(opponentId)) {
        opponentIds.add(opponentId)
        opponents.push(match.creator_id === user.id ? match.opponent : match.creator)
      }
    }

    return opponents
  }

  const sendFriendRequest = async (player) => {
    try {
      await friendsAPI.sendFriendRequest(user.id, player.id)
      alert(`Friend request sent to ${player.username}`)
      loadSocialData() // Refresh data
    } catch (error) {
      console.error('Error sending friend request:', error)
      alert('Failed to send friend request. Please try again.')
    }
  }

  const respondToFriendRequest = async (requestId, status) => {
    try {
      await friendsAPI.respondToFriendRequest(requestId, status)
      loadSocialData() // Refresh data
    } catch (error) {
      console.error('Error responding to friend request:', error)
      alert('Failed to update friend request. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading social data..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Social</h1>
          <p className="mt-2 text-gray-600">
            Connect with friends and find new opponents
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              {[
                { id: 'friends', name: 'Friends', icon: Users, count: friends.length },
                { id: 'requests', name: 'Requests', icon: Mail, count: pendingRequests.length },
                { id: 'discover', name: 'Discover', icon: UserPlus, count: recentPlayers.length }
              ].map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.name}</span>
                    {tab.count > 0 && (
                      <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Your Friends ({friends.length})
                </h2>
                {friends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend) => (
                      <PlayerCard
                        key={friend.friend_id}
                        player={friend.friend}
                        showActions={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No friends yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start by adding friends from your recent matches or discovering new players.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Pending Friend Requests ({pendingRequests.length})
                </h2>
                {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-white border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                            {request.user.avatar_url ? (
                              <img
                                src={request.user.avatar_url}
                                alt={request.user.username}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              request.user.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {request.user.username}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Wants to be your friend
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => respondToFriendRequest(request.id, 'accepted')}
                            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => respondToFriendRequest(request.id, 'rejected')}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No pending requests
                    </h3>
                    <p className="text-gray-600">
                      You're all caught up! No pending friend requests.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Discover Tab */}
            {activeTab === 'discover' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Opponents ({recentPlayers.length})
                </h2>
                {recentPlayers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentPlayers.map((player) => (
                      <PlayerCard
                        key={player.id}
                        player={player}
                        showActions={true}
                        onAction={sendFriendRequest}
                        actionLabel="Add Friend"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No recent players
                    </h3>
                    <p className="text-gray-600">
                      Play some matches to discover new players to connect with.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Social
