import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, LogOut, Truck } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'

type Props = {
  title: string
  subtitle?: string | null
  children: React.ReactNode
}

export default function CourierLayout({ title, subtitle, children }: Props) {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()

  const openBoussole = useCallback(() => {
    try {
      localStorage.setItem('mangoo-open-boussole', '1')
    } catch {
    }
    navigate('/')
  }, [navigate])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('mangoo-current-user')
    } catch {
    }
    navigate('/connexion')
  }, [navigate])

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${
        isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <nav
        className={`shadow-lg border-b-4 border-orange-500 transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <Truck className={isDark ? 'text-emerald-300' : 'text-emerald-600'} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-black truncate">{title}</div>
                  <div className={`px-2 py-1 rounded-full text-xs font-black ${isDark ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    Livrer
                  </div>
                </div>
                {subtitle ? <div className={`text-xs truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{subtitle}</div> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openBoussole}
                className={`px-3 py-2 rounded-xl font-black text-sm inline-flex items-center gap-2 transition-colors ${
                  isDark ? 'bg-gray-900 text-white hover:bg-gray-700 border border-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                Boussole
              </button>
              <button
                type="button"
                onClick={logout}
                className={`px-3 py-2 rounded-xl font-black text-sm inline-flex items-center gap-2 transition-colors ${
                  isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">{children}</main>
    </div>
  )
}
