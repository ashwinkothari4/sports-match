import React from 'react'
import { MapPin, Cloud, Home } from 'lucide-react'

const CourtCard = ({ court, selected = false, onSelect }) => {
  return (
    <div
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        selected 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-200 bg-white'
      }`}
      onClick={() => onSelect(court)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{court.name}</h3>
        <div className="flex items-center space-x-1">
          {court.outdoor ? (
            <Cloud className="h-4 w-4 text-green-600" />
          ) : (
            <Home className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-xs text-gray-500">
            {court.outdoor ? 'Outdoor' : 'Indoor'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
        <MapPin className="h-4 w-4" />
        <span>
          {court.latitude.toFixed(4)}, {court.longitude.toFixed(4)}
        </span>
      </div>

      {court.image_url && (
        <div className="mb-3">
          <img
            src={court.image_url}
            alt={court.name}
            className="w-full h-32 object-cover rounded-md"
          />
        </div>
      )}

      <div className="flex justify-between items-center text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          court.outdoor 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {court.outdoor ? 'Weather Dependent' : 'All Weather'}
        </span>
        
        {selected && (
          <span className="text-primary-600 font-medium">Selected</span>
        )}
      </div>
    </div>
  )
}

export default CourtCard
