import { supabase } from './supabase'

// User API
export const userAPI = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
    return { data, error }
  },

  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update user profile with avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) throw updateError

    return publicUrl
  }
}

// Match API
export const matchAPI = {
  async createMatch(matchData) {
    const { data, error } = await supabase
      .from('matches')
      .insert([matchData])
      .select()
      .single()
    return { data, error }
  },

  async getMatches(status = null) {
    let query = supabase
      .from('matches')
      .select(`
        *,
        creator:users!matches_creator_id_fkey(*),
        opponent:users!matches_opponent_id_fkey(*),
        court:courts(*)
      `)
      .order('scheduled_time', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    return { data, error }
  },

  async updateMatch(matchId, updates) {
    const { data, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
    return { data, error }
  },

  async findOpponents(requestData) {
    const { data, error } = await supabase.functions.invoke('matchmaking', {
      body: requestData
    })
    return { data, error }
  }
}

// Court API
export const courtAPI = {
  async getCourts() {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .order('name')
    return { data, error }
  },

  async getNearbyCourts(lat, lng, radius = 10) {
    const { data, error } = await supabase
      .rpc('get_courts_in_radius', {
        lat,
        lng,
        radius
      })
    return { data, error }
  }
}

// Leaderboard API
export const leaderboardAPI = {
  async getLeaderboard(limit = 50) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, elo, wins, losses, total_matches')
      .order('elo', { ascending: false })
      .limit(limit)
    return { data, error }
  }
}

// Friends API
export const friendsAPI = {
  async getFriends(userId) {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend:users!friends_friend_id_fkey(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')
    return { data, error }
  },

  async sendFriendRequest(userId, friendId) {
    const { data, error } = await supabase
      .from('friends')
      .insert([
        { user_id: userId, friend_id: friendId, status: 'pending' }
      ])
    return { data, error }
  },

  async respondToFriendRequest(requestId, status) {
    const { data, error } = await supabase
      .from('friends')
      .update({ status })
      .eq('id', requestId)
    return { data, error }
  }
}

// Achievements API
export const achievementsAPI = {
  async getUserAchievements(userId) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
    return { data, error }
  }
}
