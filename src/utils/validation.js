export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 6
}

export const validateUsername = (username) => {
  return username.length >= 3 && username.length <= 50
}

export const validateMatchData = (matchData) => {
  const errors = {}

  if (!matchData.scheduled_time) {
    errors.scheduled_time = 'Scheduled time is required'
  } else if (new Date(matchData.scheduled_time) < new Date()) {
    errors.scheduled_time = 'Scheduled time must be in the future'
  }

  if (!matchData.court_id) {
    errors.court_id = 'Court selection is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
