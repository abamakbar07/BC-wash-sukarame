"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Gift, Search, Star, TrendingUp, Users, Car } from "lucide-react"
import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  vehicle_plate_numbers: string[]
  total_bookings: number
  total_loyalty_points: number
  join_date: string
}

export function LoyaltyDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const customerData = await apiClient.getCustomers()
      setCustomers(customerData.customers)
    } catch (err) {
      console.error("[v0] Error fetching customers:", err)
      setError("Gagal memuat data pelanggan")
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.vehicle_plate_numbers.some((plate) => plate.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalCustomers = customers.length
  const totalLoyaltyPoints = customers.reduce((sum, customer) => sum + customer.total_loyalty_points, 0)
  const averagePointsPerCustomer = totalCustomers > 0 ? Math.round(totalLoyaltyPoints / totalCustomers) : 0
  const totalVehicles = customers.reduce((sum, customer) => sum + (Array.isArray(customer.vehicle_plate_numbers) ? customer.vehicle_plate_numbers.length : 0), 0)

  const getCustomerTier = (points: number) => {
    if (points >= 200) return { name: "Platinum", color: "bg-purple-100 text-purple-800" }
    if (points >= 100) return { name: "Gold", color: "bg-yellow-100 text-yellow-800" }
    if (points >= 50) return { name: "Silver", color: "bg-gray-100 text-gray-800" }
    return { name: "Bronze", color: "bg-orange-100 text-orange-800" }
  }

  const handleViewCustomerDetail = async (customerId: string) => {
    try {
      // Ensure customerId is valid before making the API call
      if (!customerId) {
        console.error("[v0] Invalid customer ID provided:", customerId);
        toast({
          title: "Gagal Memuat Detail",
          description: "ID pelanggan tidak valid.",
          variant: "destructive",
        });
        return;
      }
      const customerDetail = await apiClient.getCustomerDetail(customerId)
      // Handle customer detail view - could open a modal or navigate to detail page
      toast({
        title: "Detail Pelanggan",
        description: `Menampilkan detail untuk ${customerDetail.customer.name}`,
      })
    } catch (err) {
      console.error("[v0] Error fetching customer detail:", err)
      toast({
        title: "Gagal Memuat Detail",
        description: "Terjadi kesalahan saat memuat detail pelanggan.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Program Loyalitas</h1>
          <p className="text-muted-foreground mt-1">Memuat data pelanggan...</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Program Loyalitas</h1>
          <p className="text-muted-foreground mt-1">Kelola poin loyalitas dan data pelanggan</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchCustomers}>Coba Lagi</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Program Loyalitas</h1>
        <p className="text-muted-foreground mt-1">Kelola poin loyalitas dan data pelanggan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Terdaftar dalam sistem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoyaltyPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Poin yang beredar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Poin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePointsPerCustomer}</div>
            <p className="text-xs text-muted-foreground">Per pelanggan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kendaraan</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground">Terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="font-serif text-xl">Daftar Pelanggan Loyalitas</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari nama, telepon, atau plat nomor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Tidak ada pelanggan yang sesuai dengan pencarian." : "Belum ada pelanggan terdaftar."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Kendaraan</TableHead>
                    <TableHead>Total Booking</TableHead>
                    <TableHead>Poin Loyalitas</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Bergabung</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const tier = getCustomerTier(customer.total_loyalty_points)
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {totalVehicles === 0 ? (
                              <span className="text-xs text-muted-foreground">-</span>
                            ) : (
                              customer.vehicle_plate_numbers.map((plate, index) => (
                                <Badge key={index} variant="outline" className="font-mono text-xs">
                                  {plate}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-medium">{customer.total_bookings}</p>
                            <p className="text-xs text-muted-foreground">kali</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{customer.total_loyalty_points}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={tier.color}>{tier.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {new Date(customer.join_date).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            onClick={() => handleViewCustomerDetail(customer.id)}
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
