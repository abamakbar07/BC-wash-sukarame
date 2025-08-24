"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"

interface RevenueData {
  day: string
  revenue: number
  bookings: number
}

export function RevenueChart() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)
        const bookingsResponse = await apiClient.getBookings()
        const bookings = bookingsResponse.bookings

        // Get last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return date
        })

        const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

        const revenueByDay = last7Days.map((date) => {
          const dateStr = date.toISOString().split("T")[0]
          const dayBookings = bookings.filter((booking) => booking.booking_date === dateStr)
          const completedBookings = dayBookings.filter((booking) => booking.status === "completed")
          const revenue = completedBookings.reduce((sum, booking) => sum + booking.total_price, 0)

          return {
            day: dayNames[date.getDay()],
            revenue,
            bookings: dayBookings.length,
          }
        })

        setRevenueData(revenueByDay)
      } catch (err) {
        console.error("[v0] Error fetching revenue data:", err)
        setError("Gagal memuat data pendapatan")
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [])

  const chartConfig = {
    revenue: {
      label: "Pendapatan",
      color: "hsl(var(--primary))",
    },
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Pendapatan 7 Hari Terakhir</CardTitle>
          <CardDescription>Grafik pendapatan harian dalam Rupiah</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Memuat data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Pendapatan 7 Hari Terakhir</CardTitle>
          <CardDescription>Grafik pendapatan harian dalam Rupiah</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Pendapatan 7 Hari Terakhir</CardTitle>
        <CardDescription>Grafik pendapatan harian dalam Rupiah</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} className="text-xs" />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                tickFormatter={(value) => `${(value / 100000).toFixed(1)}M`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Pendapatan"]}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
