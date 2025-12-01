import { format, formatDistance, formatRelative, subDays } from 'date-fns'

// Date & Time Helpers
export const dateHelpers = {
  // Format date for display
  formatDate: (date, formatString = 'PPp') => {
    if (!date) return 'N/A'
    try {
      return format(new Date(date), formatString)
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid Date'
    }
  },

  // Format relative time (e.g., "2 days ago")
  formatRelativeTime: (date) => {
    if (!date) return 'N/A'
    try {
      return formatDistance(new Date(date), new Date(), { addSuffix: true })
    } catch (error) {
      console.error('Error formatting relative time:', error)
      return 'Invalid Date'
    }
  },

  // Format date relative to now (e.g., "yesterday at 4:30 PM")
  formatRelativeDate: (date) => {
    if (!date) return 'N/A'
    try {
      return formatRelative(new Date(date), new Date())
    } catch (error) {
      console.error('Error formatting relative date:', error)
      return 'Invalid Date'
    }
  },

  // Check if date is today
  isToday: (date) => {
    if (!date) return false
    const today = new Date()
    const checkDate = new Date(date)
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    )
  },

  // Check if date is tomorrow
  isTomorrow: (date) => {
    if (!date) return false
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const checkDate = new Date(date)
    return (
      checkDate.getDate() === tomorrow.getDate() &&
      checkDate.getMonth() === tomorrow.getMonth() &&
      checkDate.getFullYear() === tomorrow.getFullYear()
    )
  },

  // Check if date is in the past
  isPast: (date) => {
    if (!date) return false
    return new Date(date) < new Date()
  },

  // Check if date is in the future
  isFuture: (date) => {
    if (!date) return false
    return new Date(date) > new Date()
  },

  // Get time remaining until date
  getTimeRemaining: (date) => {
    if (!date) return { days: 0, hours: 0, minutes: 0 }
    
    const now = new Date()
    const target = new Date(date)
    const diff = target - now

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
  },

  // Format time remaining as string
  formatTimeRemaining: (date) => {
    const { days, hours, minutes } = dateHelpers.getTimeRemaining(date)
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes} minutes`
    } else {
      return 'Less than a minute'
    }
  },

  // Get readable time slot (e.g., "Morning", "Afternoon", "Evening")
  getTimeSlot: (date) => {
    if (!date) return 'Unknown'
    
    const hour = new Date(date).getHours()
    
    if (hour >= 5 && hour < 12) return 'Morning'
    if (hour >= 12 && hour < 17) return 'Afternoon'
    if (hour >= 17 && hour < 21) return 'Evening'
    return 'Night'
  }
}

// String & Text Helpers
export const stringHelpers = {
  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  // Convert camelCase to Title Case
  camelToTitle: (str) => {
    if (!str) return ''
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  },

  // Convert snake_case to Title Case
  snakeToTitle: (str) => {
    if (!str) return ''
    return str
      .split('_')
      .map(word => wordHelpers.capitalize(word))
      .join(' ')
  },

  // Truncate text with ellipsis
  truncate: (str, length = 100) => {
    if (!str) return ''
    if (str.length <= length) return str
    return str.substring(0, length) + '...'
  },

  // Generate initials from name
  getInitials: (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  },

  // Generate random string
  generateRandomString: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // Remove special characters and normalize
  normalizeString: (str) => {
    if (!str) return ''
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
      .toLowerCase()
      .trim()
  },

  // Check if string is empty or whitespace
  isEmpty: (str) => {
    return !str || str.trim().length === 0
  },

  // Count words in string
  countWords: (str) => {
    if (!str) return 0
    return str.trim().split(/\s+/).length
  }
}

// Number & Math Helpers
export const numberHelpers = {
  // Format number with commas
  formatNumber: (num) => {
    if (num === null || num === undefined) return '0'
    return num.toLocaleString('en-US')
  },

  // Format percentage
  formatPercentage: (value, total, decimals = 1) => {
    if (total === 0) return '0%'
    const percentage = (value / total) * 100
    return `${percentage.toFixed(decimals)}%`
  },

  // Calculate win rate
  calculateWinRate: (wins, totalMatches) => {
    if (totalMatches === 0) return 0
    return (wins / totalMatches) * 100
  },

  // Format win rate as string
  formatWinRate: (wins, totalMatches, decimals = 1) => {
    const rate = numberHelpers.calculateWinRate(wins, totalMatches)
    return `${rate.toFixed(decimals)}%`
  },

  // Clamp number between min and max
  clamp: (num, min, max) => {
    return Math.min(Math.max(num, min), max)
  },

  // Generate random number in range
  randomInRange: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  // Round to specified decimals
  round: (num, decimals = 2) => {
    const factor = Math.pow(10, decimals)
    return Math.round((num + Number.EPSILON) * factor) / factor
  },

  // Check if number is in range
  isInRange: (num, min, max) => {
    return num >= min && num <= max
  },

  // Calculate average
  average: (numbers) => {
    if (!numbers.length) return 0
    const sum = numbers.reduce((a, b) => a + b, 0)
    return sum / numbers.length
  },

  // Calculate median
  median: (numbers) => {
    if (!numbers.length) return 0
    
    const sorted = [...numbers].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2
    }
    
    return sorted[middle]
  }
}

// Object & Array Helpers
export const objectHelpers = {
  // Deep clone object
  deepClone: (obj) => {
    return JSON.parse(JSON.stringify(obj))
  },

  // Merge objects deeply
  deepMerge: (target, source) => {
    const output = { ...target }
    
    if (objectHelpers.isObject(target) && objectHelpers.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (objectHelpers.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key]
          } else {
            output[key] = objectHelpers.deepMerge(target[key], source[key])
          }
        } else {
          output[key] = source[key]
        }
      })
    }
    
    return output
  },

  // Check if value is an object
  isObject: (item) => {
    return item && typeof item === 'object' && !Array.isArray(item)
  },

  // Remove null/undefined values from object
  removeEmptyValues: (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null)
    )
  },

  // Pick specific keys from object
  pick: (obj, keys) => {
    return keys.reduce((result, key) => {
      if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = obj[key]
      }
      return result
    }, {})
  },

  // Omit specific keys from object
  omit: (obj, keys) => {
    const result = { ...obj }
    keys.forEach(key => delete result[key])
    return result
  },

  // Flatten object
  flattenObject: (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const pre = prefix.length ? `${prefix}.` : ''
      
      if (objectHelpers.isObject(obj[key])) {
        Object.assign(acc, objectHelpers.flattenObject(obj[key], pre + key))
      } else {
        acc[pre + key] = obj[key]
      }
      
      return acc
    }, {})
  }
}

export const arrayHelpers = {
  // Remove duplicates from array
  unique: (array) => {
    return [...new Set(array)]
  },

  // Remove duplicates by property
  uniqueBy: (array, property) => {
    const seen = new Set()
    return array.filter(item => {
      const value = item[property]
      if (seen.has(value)) {
        return false
      }
      seen.add(value)
      return true
    })
  },

  // Group array by property
  groupBy: (array, property) => {
    return array.reduce((groups, item) => {
      const key = item[property]
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {})
  },

  // Sort array by property
  sortBy: (array, property, direction = 'asc') => {
    return [...array].sort((a, b) => {
      const aValue = a[property]
      const bValue = b[property]
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
  },

  // Shuffle array
  shuffle: (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  },

  // Chunk array into smaller arrays
  chunk: (array, size) => {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  },

  // Find object by property value
  findBy: (array, property, value) => {
    return array.find(item => item[property] === value)
  },

  // Filter objects by property value
  filterBy: (array, property, value) => {
    return array.filter(item => item[property] === value)
  },

  // Sum values of property
  sumBy: (array, property) => {
    return array.reduce((sum, item) => sum + (item[property] || 0), 0)
  },

  // Average of property values
  averageBy: (array, property) => {
    if (array.length === 0) return 0
    const sum = arrayHelpers.sumBy(array, property)
    return sum / array.length
  }
}

// UI & Display Helpers
export const uiHelpers = {
  // Get color based on ELO
  getEloColor: (elo) => {
    if (elo >= 2000) return '#9333ea' // purple
    if (elo >= 1800) return '#dc2626' // red
    if (elo >= 1600) return '#f97316' // orange
    if (elo >= 1400) return '#eab308' // yellow
    if (elo >= 1200) return '#16a34a' // green
    return '#3b82f6' // blue
  },

  // Get color based on match status
  getStatusColor: (status) => {
    const colors = {
      scheduled: '#3b82f6', // blue
      in_progress: '#f59e0b', // amber
      completed: '#10b981', // green
      expired: '#ef4444', // red
      cancelled: '#6b7280' // gray
    }
    return colors[status] || '#6b7280'
  },

  // Get color based on subscription tier
  getTierColor: (tier) => {
    const colors = {
      free: '#6b7280', // gray
      play_plus: '#3b82f6', // blue
      elite: '#9333ea' // purple
    }
    return colors[tier] || '#6b7280'
  },

  // Get icon based on playstyle
  getPlaystyleIcon: (playstyle) => {
    const icons = {
      competitive: '⚔️',
      casual: '🏀',
      friendly: '🤝'
    }
    return icons[playstyle] || '🏀'
  },

  // Get readable match status
  getReadableStatus: (status) => {
    const statusMap = {
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      expired: 'Expired',
      cancelled: 'Cancelled'
    }
    return statusMap[status] || status
  },

  // Get readable subscription tier
  getReadableTier: (tier) => {
    const tierMap = {
      free: 'Free',
      play_plus: 'Play+',
      elite: 'Elite'
    }
    return tierMap[tier] || tier
  },

  // Get badge color based on achievement rarity
  getBadgeColor: (requirementValue) => {
    if (requirementValue >= 2000) return 'bg-purple-100 text-purple-800'
    if (requirementValue >= 1000) return 'bg-red-100 text-red-800'
    if (requirementValue >= 500) return 'bg-orange-100 text-orange-800'
    if (requirementValue >= 100) return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  },

  // Format distance in kilometers
  formatDistance: (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  },

  // Format score display
  formatScore: (score) => {
    if (score === null || score === undefined) return '-'
    return score.toString()
  }
}

// URL & Routing Helpers
export const urlHelpers = {
  // Get query parameter
  getQueryParam: (param) => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(param)
  },

  // Set query parameter
  setQueryParam: (param, value) => {
    const url = new URL(window.location)
    if (value === null || value === undefined) {
      url.searchParams.delete(param)
    } else {
      url.searchParams.set(param, value)
    }
    window.history.pushState({}, '', url)
  },

  // Get all query parameters as object
  getAllQueryParams: () => {
    const params = new URLSearchParams(window.location.search)
    const result = {}
    for (const [key, value] of params.entries()) {
      result[key] = value
    }
    return result
  },

  // Remove query parameter
  removeQueryParam: (param) => {
    urlHelpers.setQueryParam(param, null)
  },

  // Check if current path matches route
  isActiveRoute: (path) => {
    return window.location.pathname === path
  },

  // Generate URL with query parameters
  generateUrl: (path, params = {}) => {
    const url = new URL(path, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value)
      }
    })
    return url.toString()
  }
}

// Storage Helpers
export const storageHelpers = {
  // Local storage
  setLocal: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  },

  getLocal: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue
    }
  },

  removeLocal: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },

  clearLocal: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  },

  // Session storage
  setSession: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to sessionStorage:', error)
    }
  },

  getSession: (key, defaultValue = null) => {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error reading from sessionStorage:', error)
      return defaultValue
    }
  },

  removeSession: (key) => {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from sessionStorage:', error)
    }
  }
}

// Validation Helpers
export const validationHelpers = {
  // Validate email
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  },

  // Validate password strength
  isValidPassword: (password) => {
    if (!password) return false
    // At least 6 characters
    return password.length >= 6
  },

  // Validate username
  isValidUsername: (username) => {
    if (!username) return false
    // 3-30 characters, alphanumeric and underscores
    const re = /^[a-zA-Z0-9_]{3,30}$/
    return re.test(username)
  },

  // Validate URL
  isValidUrl: (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  // Validate phone number (simple)
  isValidPhone: (phone) => {
    const re = /^[\+]?[1-9][\d]{0,15}$/
    return re.test(phone.replace(/[\s\-\(\)]/g, ''))
  },

  // Validate date string
  isValidDate: (dateString) => {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date)
  },

  // Validate latitude
  isValidLatitude: (lat) => {
    return lat >= -90 && lat <= 90
  },

  // Validate longitude
  isValidLongitude: (lng) => {
    return lng >= -180 && lng <= 180
  },

  // Validate ELO value
  isValidElo: (elo) => {
    return typeof elo === 'number' && elo >= 0 && elo <= 3000
  },

  // Validate match score
  isValidScore: (score) => {
    return typeof score === 'number' && score >= 0 && score <= 200
  }
}

// Geolocation Helpers
export const geoHelpers = {
  // Calculate distance between two coordinates in meters (Haversine formula)
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371000 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c
  },

  // Calculate midpoint between two coordinates
  calculateMidpoint: (lat1, lon1, lat2, lon2) => {
    return {
      latitude: (lat1 + lat2) / 2,
      longitude: (lon1 + lon2) / 2
    }
  },

  // Check if location is within radius
  isWithinRadius: (centerLat, centerLon, checkLat, checkLon, radiusMeters) => {
    const distance = geoHelpers.calculateDistance(centerLat, centerLon, checkLat, checkLon)
    return distance <= radiusMeters
  },

  // Get user's current location
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  },

  // Format coordinates for display
  formatCoordinates: (lat, lng, decimals = 4) => {
    return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`
  }
}

// File & Image Helpers
export const fileHelpers = {
  // Validate file type
  isValidImageType: (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    return validTypes.includes(file.type)
  },

  // Validate file size
  isValidFileSize: (file, maxSizeMB = 5) => {
    return file.size <= maxSizeMB * 1024 * 1024
  },

  // Read file as data URL
  readFileAsDataURL: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  // Get file extension
  getFileExtension: (filename) => {
    return filename.split('.').pop().toLowerCase()
  },

  // Generate unique filename
  generateFilename: (originalName, prefix = '') => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const ext = fileHelpers.getFileExtension(originalName)
    return `${prefix}${timestamp}_${random}.${ext}`
  }
}

// Error Handling Helpers
export const errorHelpers = {
  // Extract error message from various error formats
  getErrorMessage: (error) => {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.error?.message) return error.error.message
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.response?.data?.error) return error.response.data.error
    return 'An unknown error occurred'
  },

  // Log error with context
  logError: (error, context = '') => {
    console.error(`[${context}]`, error)
    
    // In production, you would send to error tracking service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error)
      console.log('Error would be sent to error tracking service')
    }
  },

  // Handle API errors
  handleApiError: (error, defaultMessage = 'Request failed') => {
    const message = errorHelpers.getErrorMessage(error)
    errorHelpers.logError(error, 'API')
    return { success: false, error: message || defaultMessage }
  }
}

// Performance Helpers
export const performanceHelpers = {
  // Debounce function
  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },

  // Measure execution time
  measureTime: (func) => {
    const start = performance.now()
    const result = func()
    const end = performance.now()
    return { result, time: end - start }
  }
}

// Combine all helpers for easy import
const helpers = {
  date: dateHelpers,
  string: stringHelpers,
  number: numberHelpers,
  object: objectHelpers,
  array: arrayHelpers,
  ui: uiHelpers,
  url: urlHelpers,
  storage: storageHelpers,
  validation: validationHelpers,
  geo: geoHelpers,
  file: fileHelpers,
  error: errorHelpers,
  performance: performanceHelpers
}

// Export default for convenience
export default helpers

// Also export individual helpers for tree-shaking
export {
  dateHelpers,
  stringHelpers,
  numberHelpers,
  objectHelpers,
  arrayHelpers,
  uiHelpers,
  urlHelpers,
  storageHelpers,
  validationHelpers,
  geoHelpers,
  fileHelpers,
  errorHelpers,
  performanceHelpers
}
