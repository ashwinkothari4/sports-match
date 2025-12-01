import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { matchAPI } from '../services/api'
import MatchCard from '../components/MatchCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Calendar, Filter, Plus } from 'lucide-react'
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns'

const Schedule = () => {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, completed, my_matches

  useEffect(() => {
    loadMatches()
  }, [filter])

  const loadMatches = async () => {
    setLoading(true)
    try {
      let status = null
      if (filter === 'upcoming') status = 'scheduled'
      if (filter === 'completed') status = 'completed'

      const { data, error } = await matchAPI.getMatches(status)
      
      if (error) throw error

      let filteredMatches = data || []
      
      if (filter === 'my_matches') {
        filteredMatches = filteredMatches.filter(
          match => match.creator_id === user.id || match.opponent_id === user.id
        )
      }

      setMatches(filteredMatches)
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMatchAction = async (action, matchId) => {
    try {
      if (action === 'start') {
        await matchAPI.updateMatch(matchId, { status: 'in_progress' })
      } else if (action === 'cancel') {
        await matchAPI.updateMatch(matchId, { status: 'expired' })
      }
      
      loadMatches() // Refresh the list
    } catch (error) {
      console.error('Error updating match:', error)
      alert('Failed to update match. Please try again.')
    }
  }

  const groupMatchesByDate = (matches) => {
    const groups = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: []
    }

    matches.forEach(match => {
      const matchDate = new Date(match.scheduled_time)
      
      if (isToday(matchDate)) {
        groups.today.push(match)
      } else if (isTomorrow(matchDate)) {
        groups.tomorrow.push(match)
      } else if (isThisWeek(matchDate)) {
        groups.thisWeek.push(match)
      } else {
        groups.later.push(match)
      }
    })

    return groups
  }

  const getGroupTitle = (groupKey) => {
    switch (groupKey) {
      case 'today': return 'Today'
      case 'tomorrow': return 'Tomorrow'
      case 'thisWeek': return 'This Week'
      case 'later': return 'Upcoming'
      default: return groupKey
    }
  }

  const groupedMatches = groupMatchesByDate(matches)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading matches..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Match Schedule</h1>
              <p className="mt-2 text-gray-600">
                View and manage your upcoming basketball matches
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Link
                to="/find-match"
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Create Match</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            {['all', 'upcoming', 'completed', 'my_matches'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-md font-medium text-sm capitalize ${
                  filter === filterType
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filterType.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Matches */}
        <div className="space-y-8">
          {Object.entries(groupedMatches).map(([groupKey, groupMatches]) => 
            groupMatches.length > 0 && (
              <div key={groupKey}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{getGroupTitle(groupKey)}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                    {groupMatches.length}
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {groupMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      showActions={
                        filter === 'my_matches' && 
                        match.status === 'scheduled' &&
                        (match.creator_id === user.id || match.opponent_id === user.id)
                      }
                      onAction={handleMatchAction}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {matches.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No matches found
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'my_matches' 
                  ? "You don't have any matches scheduled. Create your first match!"
                  : "No matches match your current filters."
                }
              </p>
              {filter === 'my_matches' && (
                <Link
                  to="/find-match"
                  className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Match</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Schedule
