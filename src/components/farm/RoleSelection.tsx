'use client'

import { useAppStore, Role } from '@/store/app'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import {
  Crown, ShoppingBasket, Egg, Calculator, Stethoscope,
  ChevronRight, MapPin, Bird
} from 'lucide-react'

const roles: { role: Role; label: string; description: string; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    role: 'CEO',
    label: 'Chief Executive Officer',
    description: 'Farm-wide overview, KPIs, revenue tracking, multi-location management & strategic alerts',
    icon: <Crown className="h-8 w-8" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
  {
    role: 'SALES',
    label: 'Sales Manager',
    description: 'Record egg & bird sales, manage customers, track payments & outstanding accounts',
    icon: <ShoppingBasket className="h-8 w-8" />,
    color: 'text-green-600',
    bg: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  {
    role: 'FARM_HAND',
    label: 'Farm Hand / Egg Picker',
    description: 'Daily egg collection, mortality records, feed intake, water & farm operations',
    icon: <Egg className="h-8 w-8" />,
    color: 'text-orange-600',
    bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
  },
  {
    role: 'ACCOUNTANT',
    label: 'Accountant / Bookkeeper',
    description: 'Track expenses, revenue summaries, financial reports, payments due & receivable',
    icon: <Calculator className="h-8 w-8" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    role: 'VET',
    label: 'Veterinary Officer',
    description: 'Health checks, vaccination schedules, treatments, disease monitoring & alerts',
    icon: <Stethoscope className="h-8 w-8" />,
    color: 'text-rose-600',
    bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
  },
]

export function RoleSelection() {
  const setRole = useAppStore((s) => s.setRole)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-green-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bird className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">PoultryFarm Manager</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Ghana Poultry Management System
              </p>
            </div>
          </div>
          <p className="text-gray-600 mt-2 text-sm md:text-base max-w-xl mx-auto">
            Central information hub for your poultry farm operations. Select your role to get started with daily record keeping, reports, and critical reminders.
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {roles.map((r, index) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-200 border-2 ${r.bg} group`}
                onClick={() => setRole(r.role)}
              >
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className={`h-14 w-14 ${r.color} shrink-0`}>
                      <AvatarFallback className={`bg-white/80 ${r.color}`}>
                        {r.icon}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base md:text-lg">{r.label}</h3>
                      <p className="text-xs md:text-sm text-gray-600 mt-1 leading-relaxed">{r.description}</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 ${r.color} opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 md:mt-12"
        >
          <p className="text-xs text-gray-400">
            Managing multiple farm locations · Daily operations tracking · Financial reporting · Health monitoring
          </p>
        </motion.div>
      </div>
    </div>
  )
}
