import React, { useState, useEffect } from 'react'
import { leaderboardAPI } from '../services/api'
import LeaderboardRow from '../components/LeaderboardRow'
import LoadingSpinner from '../components/LoadingSpinner'
import { Trophy, Search, Filter } from 'lucide-react'

const Leaderboard = () => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, friends, nearby

  useEffect(() => {
    loadLeaderboard()
  }, [filter])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const { data, error } = await leaderboardAPI.getLeaderboard(100)
      
      if (error) throw error
      setPlayers(data || [])
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayers = players.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const topPlayers = filteredPlayers.slice(0, 3)
  const otherPlayers = filteredPlayers.slice(3)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading leaderboard..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          </div>
          <p className="text-gray-600">
            Top basketball players ranked by ELO rating system
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <Filter className="h-4 w-4 text-gray-400" />
              {['all', 'friends', 'nearby'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    filter === filterType
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filterType}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {topPlayers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {topPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`bg-white rounded-lg shadow-md p-6 text-center ${
                  index === 0 ? 'md:order-2' : index === 1 ? 'md:order-1' : 'md:order-3'
                }`}
              >
                {/* Rank Badge */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                  index === 0 ? 'bg-yellow-100 text-yellow-600' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <Trophy className="h-6 w-6" />
                </div>

                {/* Player Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-xl">
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.username}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      player.username.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                {/* Player Info */}
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {player.username}
                </h3>
                <div className="text-2xl font-bold text-primary-600 mb-2">
                  {player.elo}
                </div>
                <div className="text-sm text-gray-600">
                  {player.wins}W - {player.losses}L
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="space-y-3">
          {otherPlayers.map((player, index) => (
            <LeaderboardRow
              key={player.id}
              player={player}
              rank={index + 4} // +4 because top 3 are already displayed
            />
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No players found
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'No players match your search criteria.'
                : 'No players available in the leaderboard.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
