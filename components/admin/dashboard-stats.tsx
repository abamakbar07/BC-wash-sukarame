"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, DollarSign, Car, Users, TrendingUp, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { ErrorState } from "@/components/ui/error-state"
import { showErrorToast } from "@/lib/error-utils"
import { formatCurrency } from "@/lib/utils"

interface DashboardStatsData {
  totalBookingsToday: number
  dailyRevenue: number
  activeServices: number
  newCustomers: number
  averageServiceTime: number
  customerSatisfaction: number
  bookingGrowth: number
  revenueGrowth: number
  newCustomerGrowth: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const [bookingsResponse, servicesResponse, customersResponse] = await Promise.all([
          apiClient.getBookings(),
          apiClient.getServices(),
          apiClient.getCustomers(),
        ])

        const { bookings } = bookingsResponse
        const { services } = servicesResponse
        const { customers } = customersResponse

        const today = new Date().toISOString().split("T")[0]
        const todayBookings = bookings.filter((booking) => booking.booking_date === today)
        const completedTodayBookings = todayBookings.filter((b) => b.status === "completed")

        const dailyRevenue = completedTodayBookings.reduce((sum, booking) => sum + booking.total_price, 0)

        // Calculate new customers (joined in last 7 days)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const newCustomers = customers.filter((customer) => new Date(customer.join_date) >= weekAgo).length

        // Calculate average service time from services
        const avgServiceTime =
          services.length > 0
            ? Math.round(services.reduce((sum, service) => sum + service.duration, 0) / services.length)
            : 45

        const statsData: DashboardStatsData = {
          totalBookingsToday: todayBookings.length,
          dailyRevenue,
          activeServices: services.length,
          newCustomers,
          averageServiceTime: avgServiceTime,
          customerSatisfaction: 4.8, // This would come from a reviews/ratings system
          bookingGrowth: 12, // This would be calculated from historical data
          revenueGrowth: 8, // This would be calculated from historical data
          newCustomerGrowth: 25, // This would be calculated from historical data
        }

        setStats(statsData)
      } catch (err) {
        console.error("[v0] Error fetching dashboard stats:", err)
        const errorMessage = "Gagal memuat statistik dashboard"
        setError(errorMessage)
        showErrorToast(err, "Gagal Memuat Statistik")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  const getChangeColor = (type: "positive" | "negative" | "neutral") => {
    switch (type) {
      case "positive":
        return "text-green-600"
      case "negative":
        return "text-red-600"
      case "neutral":
        return "text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <ErrorState title="Gagal Memuat Statistik" message={error} onRetry={() => window.location.reload()} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-full">
          <CardContent className="pt-6">
            <ErrorState title="Data Tidak Tersedia" message="Statistik dashboard tidak dapat dimuat" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const statsConfig = [
    {
      title: "Total Booking Hari Ini",
      value: stats.totalBookingsToday.toString(),
      change: `+${stats.bookingGrowth}%`,
      changeType: "positive" as const,
      icon: Calendar,
      description: "dari kemarin",
    },
    {
      title: "Pendapatan Hari Ini",
      value: formatCurrency(stats.dailyRevenue),
      change: `+${stats.revenueGrowth}%`,
      changeType: "positive" as const,
      icon: DollarSign,
      description: "dari kemarin",
    },
    {
      title: "Layanan Aktif",
      value: stats.activeServices.toString(),
      change: "0%",
      changeType: "neutral" as const,
      icon: Car,
      description: "total layanan",
    },
    // {
    //   title: "Pelanggan Baru",
    //   value: stats.newCustomers.toString(),
    //   change: `+${stats.newCustomerGrowth}%`,
    //   changeType: "positive" as const,
    //   icon: Users,
    //   description: "minggu ini",
    // },
    // {
    //   title: "Rata-rata Waktu Layanan",
    //   value: `${stats.averageServiceTime} min`,
    //   change: "-5%",
    //   changeType: "positive" as const,
    //   icon: Clock,
    //   description: "lebih cepat",
    // },
    // {
    //   title: "Tingkat Kepuasan",
    //   value: `${stats.customerSatisfaction}/5`,
    //   change: "+0.2",
    //   changeType: "positive" as const,
    //   icon: TrendingUp,
    //   description: "rating rata-rata",
    // },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsConfig.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs">
                <span className={getChangeColor(stat.changeType)}>{stat.change}</span>
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
