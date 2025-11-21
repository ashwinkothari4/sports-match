import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { matchAPI } from '../services/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import { TrendingUp, Calendar, Filter } from 'lucide-react'

const MatchHistory = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [eloHistory, setEloHistory] = useState([])
  const [timeRange, setTimeRange] = useState('30days') // 7days, 30days, 90days, all
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatchHistory()
  }, [timeRange])

  const loadMatchHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await matchAPI.getMatches('completed')
      
      if (error) throw error

      const filteredMatches = filterMatchesByTimeRange(data || [])
      setMatches(filteredMatches)
      
      // Generate ELO history data
      const historyData = generateELOHistory(filteredMatches)
      setEloHistory(historyData)

    } catch (error) {
      console.error('Error loading match history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMatchesByTimeRange = (matches) => {
    const now = new Date()
    let startDate

    switch (timeRange) {
      case '7days':
        startDate = subDays(now, 7)
        break
      case '30days':
        startDate = subDays(now, 30)
        break
      case '90days':
        startDate = subDays(now, 90)
        break
      default:
        return matches // all time
    }

    return matches.filter(match => 
      new Date(match.scheduled_time) >= startDate
    )
  }

  const generateELOHistory = (matches) => {
    // This would normally come from match_history table with actual ELO changes
    // For now, we'll simulate based on wins/losses
    let currentELO = 1200 // Starting ELO
    const history = []
    const userMatches = matches
      .filter(match => match.creator_id === user.id || match.opponent_id === user.id)
      .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))

    userMatches.forEach((match, index) => {
      const userWon = (match.creator_id === user.id && match.match_score?.creator > match.match_score?.opponent) ||
                     (match.opponent_id === user.id && match.match_score?.opponent > match.match_score?.creator)
      
      // Simulate ELO change
      const eloChange = userWon ? 15 : -12
      currentELO += eloChange

      history.push({
        date: format(new Date(match.scheduled_time), 'MMM dd'),
        elo: currentELO,
        match: `Match ${index + 1}`,
        result: userWon ? 'Win' : 'Loss',
        change: eloChange
      })
    })

    return history
  }

  const getStats = () => {
    const userMatches = matches.filter(match => 
      match.creator_id === user.id || match.opponent_id === user.id
    )
    
    const wins = userMatches.filter(match => 
      (match.creator_id === user.id && match.match_score?.creator > match.match_score?.opponent) ||
      (match.opponent_id === user.id && match.match_score?.opponent > match.match_score?.creator)
    ).length

    const losses = userMatches.length - wins
    const winRate = userMatches.length > 0 ? ((wins / userMatches.length) * 100).toFixed(1) : 0

    const currentStreak = calculateCurrentStreak(userMatches)
    const bestStreak = calculateBestStreak(userMatches)

    return { total: userMatches.length, wins, losses, winRate, currentStreak, bestStreak }
  }

  const calculateCurrentStreak = (userMatches) => {
    let streak = 0
    const sortedMatches = [...userMatches].sort((a, b) => 
      new Date(b.scheduled_time) - new Date(a.scheduled_time)
    )

    for (const match of sortedMatches) {
      const userWon = (match.creator_id === user.id && match.match_score?.creator > match.match_score?.opponent) ||
                     (match.opponent_id === user.id && match.match_score?.opponent > match.match_score?.creator)
      
      if (userWon) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const calculateBestStreak = (userMatches) => {
    let bestStreak = 0
    let currentStreak = 0

    const sortedMatches = [...userMatches].sort((a, b) => 
      new Date(a.scheduled_time) - new Date(b.scheduled_time)
    )

    for (const match of sortedMatches) {
      const userWon = (match.creator_id === user.id && match.match_score?.creator > match.match_score?.opponent) ||
                     (match.opponent_id === user.id && match.match_score?.opponent > match.match_score?.creator)
      
      if (userWon) {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return bestStreak
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Match History & Analytics</h1>
          <p className="mt-2 text-gray-600">
            Track your performance and ELO progression over time
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Matches</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
            <div className="text-sm text-gray-600">Wins</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
            <div className="text-sm text-gray-600">Losses</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.winRate}%</div>
            <div className="text-sm text-gray-600">Win Rate</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.currentStreak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            {['7days', '30days', '90days', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md font-medium text-sm capitalize ${
                  timeRange === range
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === '7days' ? '7 Days' :
                 range === '30days' ? '30 Days' :
                 range === '90days' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* ELO Progress Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-6 w-6 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900">ELO Progression</h2>
          </div>
          
          {eloHistory.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eloHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="match" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'elo') return [value, 'ELO']
                      return [value, name]
                    }}
                    labelFormatter={(label) => `Match: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="elo" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#1d4ed8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No match data available
              </h3>
              <p className="text-gray-600">
                Play some matches to see your ELO progression.
              </p>
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="h-6 w-6 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Matches</h2>
          </div>

          {matches.filter(m => m.creator_id === user.id || m.opponent_id === user.id).length > 0 ? (
            <div className="space-y-4">
              {matches
                .filter(match => match.creator_id === user.id || match.opponent_id === user.id)
                .slice(0, 10)
                .map((match) => {
                  const userWon = (match.creator_id === user.id && match.match_score?.creator > match.match_score?.opponent) ||
                                 (match.opponent_id === user.id && match.match_score?.opponent > match.match_score?.creator)
                  
                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-3 h-3 rounded-full ${
                          userWon ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-center flex-1">
                            <div className="font-semibold text-gray-900">
                              {match.creator.username}
                            </div>
                            <div className="text-lg font-bold text-primary-600">
                              {match.match_score?.creator || '-'}
                            </div>
                          </div>
                          
                          <div className="text-gray-400">vs</div>
                          
                          <div className="text-center flex-1">
                            <div className="font-semibold text-gray-900">
                              {match.opponent.username}
                            </div>
                            <div className="text-lg font-bold text-primary-600">
                              {match.match_score?.opponent || '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {format(new Date(match.scheduled_time), 'MMM dd, yyyy')}
                        </div>
                        <div className={`text-sm font-medium ${
                          userWon ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {userWon ? 'Win' : 'Loss'}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No matches found
              </h3>
              <p className="text-gray-600">
                {timeRange !== 'all' 
                  ? `No matches in the selected time range. Try changing the filter.`
                  : 'You haven\'t played any matches yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchHistory
