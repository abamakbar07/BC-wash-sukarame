"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Car, Bike, Crown, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

interface Service {
  id: string
  name: string
  description: string
  category: "car-regular" | "car-premium" | "motorcycle" | string
  price: number
  duration: number
  features: string[] | null
  supports_pickup?: boolean
  pickup_fee?: number
  loyalty_points_reward?: number | null
}

export default function ServicesPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || "all")
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchServices = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/services", { cache: "no-store" })

        if (!response.ok) {
          throw new Error(`Failed to load services: ${response.statusText}`)
        }

        const data = await response.json()
        if (!isMounted) return

        const servicesData = Array.isArray(data?.services) ? data.services : []
        setServices(servicesData)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        console.error("[v0] Failed to fetch services:", err)
        setError("Gagal memuat data layanan. Silakan coba lagi nanti.")
        setServices([])
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchServices()

    return () => {
      isMounted = false
    }
  }, [])

  const categories = [
    { id: "all", name: "Semua Layanan", icon: null },
    { id: "car-regular", name: "Mobil Regular", icon: Car },
    { id: "car-premium", name: "Mobil Premium", icon: Crown },
    { id: "motorcycle", name: "Motor", icon: Bike },
  ]

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") {
      return services
    }

    return services.filter((service) => service.category === selectedCategory)
  }, [selectedCategory, services])

  const getCategoryName = (category: Service["category"]) => {
    switch (category) {
      case "car-regular":
        return "Mobil Regular"
      case "car-premium":
        return "Mobil Premium"
      case "motorcycle":
        return "Motor"
      default:
        return category
    }
  }

  const getCategoryColor = (category: Service["category"]) => {
    switch (category) {
      case "car-regular":
        return "bg-blue-100 text-blue-800"
      case "car-premium":
        return "bg-purple-100 text-purple-800"
      case "motorcycle":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </Button>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Daftar Layanan</h1>
          <p className="text-lg text-muted-foreground">Pilih layanan yang sesuai dengan kebutuhan kendaraan Anda</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                {IconComponent && <IconComponent className="w-4 h-4" />}
                {category.name}
              </Button>
            )
          })}
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!isLoading &&
            !error &&
            filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getCategoryColor(service.category)}>{getCategoryName(service.category)}</Badge>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(service.price)}</p>
                      <p className="text-sm text-muted-foreground">~{service.duration} menit</p>
                    </div>
                  </div>
                  <CardTitle className="font-serif text-lg leading-tight">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(service.features) && service.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">Bonus:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button asChild className="w-full">
                    <Link href={`/booking?service=${service.id}`}>Pilih Layanan Ini</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Memuat data layanan...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-12">
            <p className="text-lg text-destructive">{error}</p>
          </div>
        )}

        {!isLoading && !error && filteredServices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Tidak ada layanan yang ditemukan untuk kategori ini.</p>
          </div>
        )}
      </div>
    </div>
  )
}
