import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">iS</span>
              </div>
              <span className="font-bold text-xl text-white">iSIWES</span>
            </div>
            <p className="text-slate-400 max-w-md">
              Connecting Nigerian students with industrial training opportunities. 
              Building the future of workforce development, one placement at a time.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">For Students</Link></li>
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">For Organizations</Link></li>
              <li><Link to="/login" className="hover:text-primary-400 transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} iSIWES. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
