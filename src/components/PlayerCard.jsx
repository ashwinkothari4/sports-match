import React from 'react'
import { Link } from 'react-router-dom'
import { Trophy, MapPin, Users, Star } from 'lucide-react'
import { getELOTier } from '../utils/elo'

const PlayerCard = ({ player, showActions = false, onAction, actionLabel }) => {
  const eloTier = getELOTier(player.elo)
  const winRate = player.total_matches > 0 
    ? ((player.wins / player.total_matches) * 100).toFixed(1) 
    : 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
            {player.avatar_url ? (
              <img
                src={player.avatar_url}
                alt={player.username}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              player.username.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {player.username}
            </h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${eloTier.color}`}>
              {eloTier.name}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Trophy className="h-4 w-4" />
              <span>ELO: {player.elo}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{player.total_matches} matches</span>
            </div>
          </div>

          <div className="mt-2 flex items-center space-x-4 text-sm">
            <div>
              <span className="font-semibold text-green-600">{player.wins}W</span>
              <span className="text-gray-400 mx-1">•</span>
              <span className="font-semibold text-red-600">{player.losses}L</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{winRate}% win rate</span>
            </div>
          </div>

          {player.playstyle && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {player.playstyle}
              </span>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="mt-4 flex space-x-2">
          <Link
            to={`/profile/${player.id}`}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 text-sm font-medium text-center"
          >
            View Profile
          </Link>
          <button
            onClick={() => onAction(player)}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 text-sm font-medium"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default PlayerCard
