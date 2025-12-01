import React from 'react'
import { X, MapPin, Users, Trophy, Star } from 'lucide-react'
import PlayerCard from '../components/PlayerCard'

const MatchSuggestionsModal = ({ suggestions, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Match Suggestions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            We found {suggestions.length} potential opponents based on your preferences.
            Select one to create a match.
          </p>

          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.user.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                      {suggestion.user.avatar_url ? (
                        <img
                          src={suggestion.user.avatar_url}
                          alt={suggestion.user.username}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        suggestion.user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {suggestion.user.username}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>ELO: {suggestion.user.elo}</span>
                        <span>{suggestion.user.wins}W - {suggestion.user.losses}L</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <Star className="h-4 w-4" />
                      <span className="font-semibold">{suggestion.score.toFixed(1)}</span>
                    </div>
                    <div className="text-sm text-gray-500">Match Score</div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{suggestion.distance.toFixed(1)} km away</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{suggestion.user.playstyle}</span>
                  </div>
                </div>

                {/* Midpoint Location */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Suggested Meeting Point</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Latitude: {suggestion.midpoint.latitude.toFixed(4)}, 
                    Longitude: {suggestion.midpoint.longitude.toFixed(4)}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onSelect(suggestion.user, suggestion.midpoint)}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 font-medium transition-colors"
                >
                  Create Match with {suggestion.user.username}
                </button>
              </div>
            ))}
          </div>

          {suggestions.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No matches found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or expanding the search radius.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchSuggestionsModal
