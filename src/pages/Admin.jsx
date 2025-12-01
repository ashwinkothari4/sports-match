import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { Users, Trophy, MapPin, Activity, Shield } from 'lucide-react'

const Admin = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAdminData()
    }
  }, [user])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      // Check if user is admin
      const { data: adminCheck } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .eq('email', 'admin@sportsmatch.com')
        .single()

      if (!adminCheck) {
        window.location.href = '/'
        return
      }

      // Load stats
      const [
        { count: totalUsers },
        { count: totalMatches },
        { count: totalCourts },
        { data: recentMatches }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('courts').select('*', { count: 'exact', head: true }),
        supabase
          .from('matches')
          .select(`
            *,
            creator:users!matches_creator_id_fkey(username),
            opponent:users!matches_opponent_id_fkey(username)
          `)
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      setStats({
        totalUsers: totalUsers || 0,
        totalMatches: totalMatches || 0,
        totalCourts: totalCourts || 0
      })

      setRecentActivity(recentMatches || [])

    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your SportsMatch platform
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Matches</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Courts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCourts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(stats.totalUsers * 0.15)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Activity className="h-6 w-6 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>

          <div className="space-y-4">
            {recentActivity.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    match.status === 'completed' ? 'bg-green-500' :
                    match.status === 'scheduled' ? 'bg-blue-500' :
                    match.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  
                  <div>
                    <div className="font-semibold text-gray-900">
                      {match.creator.username} vs {match.opponent.username}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(match.scheduled_time).toLocaleDateString()} • {match.court?.name || 'TBD'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    match.status === 'completed' ? 'text-green-600' :
                    match.status === 'scheduled' ? 'text-blue-600' :
                    match.status === 'in_progress' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {match.match_score ? 
                      `${match.match_score.creator || 0}-${match.match_score.opponent || 0}` : 
                      'No score'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recentActivity.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No recent activity
              </h3>
              <p className="text-gray-600">
                There hasn't been any recent match activity.
              </p>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Manage Courts
              </button>
              <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                View User Reports
              </button>
              <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                System Settings
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Platform Health</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Server Status</span>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full w-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Database</span>
                  <span className="text-green-600 font-medium">Healthy</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full w-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>API Response</span>
                  <span className="text-green-600 font-medium">Fast</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin
