import React from 'react'
import { Trophy, Award, Star, Zap } from 'lucide-react'

const BadgeList = ({ achievements, earnedAchievements = [] }) => {
  const getIcon = (iconName) => {
    switch (iconName) {
      case '🏆': return Trophy
      case '⭐': return Star
      case '🔥': return Zap
      case '🎯': return Award
      default: return Trophy
    }
  }

  const isEarned = (achievementId) => {
    return earnedAchievements.some(earned => earned.achievement_id === achievementId)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((achievement) => {
        const IconComponent = getIcon(achievement.icon)
        const earned = isEarned(achievement.id)
        
        return (
          <div
            key={achievement.id}
            className={`border rounded-lg p-4 transition-all ${
              earned
                ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${
                earned ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
              }`}>
                <IconComponent className="h-5 w-5" />
              </div>
              
              <div className="flex-1">
                <h4 className={`font-semibold text-sm ${
                  earned ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {achievement.name}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {achievement.description}
                </p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {achievement.requirement_type}: {achievement.requirement_value}
                  </span>
                  {earned && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Earned
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default BadgeList
