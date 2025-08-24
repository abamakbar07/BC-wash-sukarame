"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import type { Booking, Service, Branch } from "@/lib/dummy-data"

interface BookingWithDetails extends Booking {
  service?: Service
  branch?: Branch
}

export function RecentBookings() {
  const [recentBookings, setRecentBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        setLoading(true)
        const [{ bookings }, { services }, { branches }] = await Promise.all([
          apiClient.getBookings(),
          apiClient.getServices(),
          apiClient.getBranches(),
        ])

        // Get the 5 most recent bookings
        const sortedBookings = bookings
          .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
          .slice(0, 5)

        // Enrich bookings with service and branch details
        const enrichedBookings: BookingWithDetails[] = sortedBookings.map((booking) => ({
          ...booking,
          service: services.find((s) => s.id === booking.service_id),
          branch: branches.find((b) => b.id === booking.branch_id),
        }))

        console.log("Enriched Bookings:", enrichedBookings)

        setRecentBookings(enrichedBookings)
      } catch (err) {
        console.error("[v0] Error fetching recent bookings:", err)
        setError("Gagal memuat booking terbaru")
      } finally {
        setLoading(false)
      }
    }

    fetchRecentBookings()
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Dikonfirmasi</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Menunggu</Badge>
      case "in-progress":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Berlangsung</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Selesai</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Dibatalkan</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-xl">Booking Terbaru</CardTitle>
          <Button variant="outline" size="sm" disabled>
            Lihat Semua
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-xl">Booking Terbaru</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/bookings">Lihat Semua</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-600 py-8">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-xl">Booking Terbaru</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/bookings">Lihat Semua</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada booking hari ini</p>
          ) : (
            recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{booking.customer_name}</span>
                    <span className="text-xs text-muted-foreground">#{booking.booking_code}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{booking.services?.name || "Layanan tidak ditemukan"}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {format(booking.booking_date ? new Date(booking.booking_date + "T00:00:00") : new Date(), "dd MMM yyyy", { locale: id })}
                    </span>
                    <span>•</span>
                    <span>{booking.branches?.name || "Cabang tidak ditemukan"}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-sm">{formatCurrency(booking.total_price)}</p>
                  {getStatusBadge(booking.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
