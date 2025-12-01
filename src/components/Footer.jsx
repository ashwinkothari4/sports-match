import React from 'react'
import { Link } from 'react-router-dom'
import { Basketball, Twitter, Facebook, Instagram } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <Basketball className="h-8 w-8 text-primary-400" />
              <span className="font-bold text-xl">SportsMatch</span>
            </Link>
            <p className="mt-4 text-gray-400">
              Connecting basketball players through skill-based matchmaking and community features.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Features</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/find-match" className="text-base text-gray-300 hover:text-white">Find Match</Link></li>
              <li><Link to="/leaderboard" className="text-base text-gray-300 hover:text-white">Leaderboard</Link></li>
              <li><Link to="/social" className="text-base text-gray-300 hover:text-white">Social</Link></li>
              <li><Link to="/courts" className="text-base text-gray-300 hover:text-white">Courts</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-base text-gray-300 hover:text-white">Help Center</a></li>
              <li><a href="#" className="text-base text-gray-300 hover:text-white">Safety</a></li>
              <li><a href="#" className="text-base text-gray-300 hover:text-white">Community Guidelines</a></li>
              <li><a href="#" className="text-base text-gray-300 hover:text-white">Contact Us</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-2">
              <li><a href="#" className="text-base text-gray-300 hover:text-white">About</a></li>
              <li><a href="#" className="text-base text-gray-300 hover:text-white">Careers</a></li>
              <li><a href="#" className="text-base text-gray-300 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-base text-gray-300 hover:text-white">Press</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; 2024 SportsMatch. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
