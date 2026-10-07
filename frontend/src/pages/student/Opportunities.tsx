import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Clock, Briefcase, Filter, Building2 } from 'lucide-react'
import { opportunityApi } from '../../services/api'

export default function StudentOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    fieldOfStudy: '',
    location: '',
    workArrangement: '',
  })

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (filters.fieldOfStudy) params.fieldOfStudy = filters.fieldOfStudy
      if (filters.location) params.location = filters.location
      if (filters.workArrangement) params.workArrangement = filters.workArrangement

      const response = await opportunityApi.list(params)
      setOpportunities(response.opportunities)
    } catch (error) {
      console.error('Failed to fetch opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOpportunities()
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Browse Opportunities</h1>
          <p className="text-slate-600 mb-8">Find SIWES placements that match your profile</p>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search by title, description, or field of study..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  value={filters.fieldOfStudy}
                  onChange={(e) => setFilters({ ...filters, fieldOfStudy: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Fields</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Accounting">Accounting</option>
                  <option value="Business Administration">Business Administration</option>
                </select>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Locations</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Port Harcourt">Port Harcourt</option>
                  <option value="Ibadan">Ibadan</option>
                  <option value="Kano">Kano</option>
                </select>
                <select
                  value={filters.workArrangement}
                  onChange={(e) => setFilters({ ...filters, workArrangement: e.target.value })}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-600">No opportunities found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunities.map((opp, index) => (
                <motion.div
                  key={opp._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Building2 className="text-primary-600" size={20} />
                      </div>
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                        {opp.workArrangement}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{opp.title}</h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{opp.description}</p>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400" />
                        {opp.location?.city}, {opp.location?.state}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        {opp.durationWeeks} weeks
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-slate-400" />
                        {opp.availableSlots} slots available
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <button className="w-full py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
