"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Bike, Crown, Zap } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import type { Service } from "@/lib/dummy-data"

interface ServiceCategory {
  id: string
  title: string
  description: string
  icon: any
  priceRange: string
  services: Service[]
}

export function ServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
        const fetchServices = async () => {
          try {
            setLoading(true)
            const { services } = await apiClient.getServices({ is_active: true })

            const categoryMap = {
          "car-regular": {
            id: "car-regular",
            title: "Cuci Mobil Regular",
            description: "Layanan cuci mobil standar dengan kualitas terbaik",
            icon: Car,
          },
          "car-premium": {
            id: "car-premium",
            title: "Cuci Mobil Premium",
            description: "Layanan premium dengan teknologi hidrolik dan bonus minuman",
            icon: Crown,
          },
          motorcycle: {
            id: "motorcycle",
            title: "Cuci Motor",
            description: "Layanan cuci motor steam untuk semua ukuran",
            icon: Bike,
          },
        }

        const groupedCategories = Object.entries(categoryMap)
          .map(([categoryId, categoryInfo]) => {
            const categoryServices = services.filter((service) => service.category === categoryId)
            const prices = categoryServices.map((s) => s.price)
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)

            return {
              ...categoryInfo,
              priceRange: `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`,
              services: categoryServices,
            }
          })
          .filter((category) => category.services.length > 0)

        setCategories(groupedCategories)
      } catch (err) {
        console.error("[v0] Error fetching services:", err)
        setError("Gagal memuat layanan. Silakan coba lagi.")
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Pilihan Layanan Kami</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Berbagai paket layanan cuci kendaraan dengan teknologi modern dan harga terjangkau
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Pilihan Layanan Kami</h2>
            <p className="text-lg text-red-600 mb-8">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Pilihan Layanan Kami</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Berbagai paket layanan cuci kendaraan dengan teknologi modern dan harga terjangkau
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Card key={category.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-xl">{category.title}</CardTitle>
                  <CardDescription className="text-sm">{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Mulai dari</p>
                    <p className="text-2xl font-bold text-primary">IDR {category.priceRange}</p>
                  </div>
                  <div className="space-y-2">
                    {category.services.slice(0, 3).map((service, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{service.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full mt-6">
                    <Link href={`/services?category=${category.id}`}>Pilih Layanan</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
