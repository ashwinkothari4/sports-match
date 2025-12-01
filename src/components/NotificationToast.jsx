import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const NotificationToast = ({ notification, onClose, autoClose = true, duration = 5000 }) => {
  const { type, title, message, id } = notification

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, id, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      default:
        return <Info className="h-5 w-5 text-blue-400" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className={`flex items-start p-4 rounded-lg border ${getBackgroundColor()} shadow-lg max-w-sm w-full animate-in slide-in-from-right-full duration-300`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-gray-900">
          {title}
        </h3>
        {message && (
          <p className="mt-1 text-sm text-gray-600">
            {message}
          </p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default NotificationToast
