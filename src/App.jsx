// Update your App.jsx to include the new contexts
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { MatchmakingProvider } from './context/MatchmakingContext'
import { SubscriptionProvider } from './context/SubscriptionContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
// ... other imports

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <MatchmakingProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  {/* Your routes */}
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </MatchmakingProvider>
      </SubscriptionProvider>
    </AuthProvider>
  )
}

export default App
