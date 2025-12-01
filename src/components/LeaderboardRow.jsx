import React from 'react'
import { Link } from 'react-router-dom'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getELOTier } from '../utils/elo'

const LeaderboardRow = ({ player, rank, previousRanks = {} }) => {
  const eloTier = getELOTier(player.elo)
  const previousRank = previousRanks[player.id]
  const rankChange = previousRank ? previousRank - rank : 0
  const winRate = player.total_matches > 0 
    ? ((player.wins / player.total_matches) * 100).toFixed(1) 
    : 0

  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Trophy className="h-5 w-5 text-orange-500" />
    return <span className="text-sm font-medium text-gray-500">#{rank}</span>
  }

  const getTrendIcon = () => {
    if (rankChange > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (rankChange < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        {/* Rank and Player Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center justify-center w-8">
            {getRankIcon()}
          </div>

          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
              {player.avatar_url ? (
                <img
                  src={player.avatar_url}
                  alt={player.username}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                player.username.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* Player Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link
                to={`/profile/${player.id}`}
                className="font-semibold text-gray-900 hover:text-primary-600 truncate"
              >
                {player.username}
              </Link>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${eloTier.color}`}>
                {eloTier.name}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
              <span>ELO: {player.elo}</span>
              <span>{player.wins}W - {player.losses}L</span>
              <span>{winRate}% win rate</span>
            </div>
          </div>
        </div>

        {/* Rank Change */}
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          {rankChange !== 0 && (
            <span className={`text-sm font-medium ${
              rankChange > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(rankChange)}
            </span>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-gray-600">
        <div className="text-center">
          <div className="font-semibold text-gray-900">{player.total_matches}</div>
          <div className="text-xs">Total Matches</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-600">{player.wins}</div>
          <div className="text-xs">Wins</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{winRate}%</div>
          <div className="text-xs">Win Rate</div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardRow
