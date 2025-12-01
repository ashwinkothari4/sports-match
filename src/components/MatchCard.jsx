import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Trophy } from 'lucide-react'
import { format } from 'date-fns'

const MatchCard = ({ match, showActions = false, onAction }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Scheduled'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'expired': return 'Expired'
      default: return status
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {match.creator.username} vs {match.opponent.username}
          </h3>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(match.scheduled_time), 'MMM d, yyyy h:mm a')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{match.court?.name || 'TBD'}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
          {getStatusText(match.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="font-semibold text-gray-900">{match.creator.username}</div>
          <div className="text-sm text-gray-600">ELO: {match.creator.elo}</div>
          {match.match_score && (
            <div className="text-lg font-bold text-primary-600">
              {match.match_score.creator || '-'}
            </div>
          )}
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="font-semibold text-gray-900">{match.opponent.username}</div>
          <div className="text-sm text-gray-600">ELO: {match.opponent.elo}</div>
          {match.match_score && (
            <div className="text-lg font-bold text-primary-600">
              {match.match_score.opponent || '-'}
            </div>
          )}
        </div>
      </div>

      {match.court && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <MapPin className="h-4 w-4" />
          <span>{match.court.name}</span>
          {match.court.outdoor && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Outdoor
            </span>
          )}
        </div>
      )}

      {showActions && match.status === 'scheduled' && (
        <div className="flex space-x-2">
          <button
            onClick={() => onAction('start', match.id)}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 text-sm font-medium"
          >
            Start Match
          </button>
          <button
            onClick={() => onAction('cancel', match.id)}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {match.status === 'completed' && (
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-600">
            Completed {format(new Date(match.updated_at), 'MMM d, yyyy')}
          </div>
          <Link
            to={`/match/${match.id}`}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View Details
          </Link>
        </div>
      )}
    </div>
  )
}

export default MatchCard
