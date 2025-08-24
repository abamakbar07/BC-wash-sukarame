"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Car, Bike, Crown } from "lucide-react"
import Link from "next/link"
import { apiClient, type Service } from "@/lib/api-client"
import { ErrorState } from "@/components/ui/error-state"
import { showErrorToast } from "@/lib/error-utils"
import { formatCurrency } from "@/lib/utils"

interface ServiceSelectionProps {
  preselectedServiceId?: string | null
  onNext: () => void
  onServiceSelect: (service: Service) => void
  selectedService?: Service
}

export function ServiceSelection({
  preselectedServiceId,
  onNext,
  onServiceSelect,
  selectedService,
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([])
  const [selected, setSelected] = useState<Service | undefined>(selectedService)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (preselectedServiceId && !selected && services.length > 0) {
      const service = services.find((s) => s.id === preselectedServiceId)
      if (service) {
        setSelected(service)
        onServiceSelect(service)
      }
    }
  }, [preselectedServiceId, selected, services, onServiceSelect])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)

      const { services: servicesData } = await apiClient.getServices()
      const activeServices = servicesData.filter((service) => service.is_active)
      setServices(activeServices)
    } catch (err) {
      console.error("[v0] Error fetching services:", err)
      const errorMessage = "Gagal memuat data layanan"
      setError(errorMessage)
      showErrorToast(err, "Gagal Memuat Layanan")
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelected(service)
    onServiceSelect(service)
  }

  const getCategoryName = (category: string) => {
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

  const getCategoryColor = (category: string) => {
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "car-regular":
        return Car
      case "car-premium":
        return Crown
      case "motorcycle":
        return Bike
      default:
        return Car
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Pilih Layanan</h1>
            <p className="text-muted-foreground mt-1">Memuat layanan yang tersedia...</p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Pilih Layanan</h1>
            <p className="text-muted-foreground mt-1">Pilih jenis layanan yang Anda inginkan</p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </Button>
        </div>

        <ErrorState title="Gagal Memuat Layanan" message={error} onRetry={fetchServices} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Pilih Layanan</h1>
          <p className="text-muted-foreground mt-1">Pilih jenis layanan yang Anda inginkan</p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
        </Button>
      </div>

      {services.length === 0 ? (
        <ErrorState
          title="Layanan Tidak Tersedia"
          message="Saat ini tidak ada layanan yang tersedia. Silakan coba lagi nanti."
          showRetry={false}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => {
            const IconComponent = getCategoryIcon(service.category)
            const isSelected = selected?.id === service.id

            return (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
                onClick={() => handleServiceSelect(service)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getCategoryColor(service.category)}>
                      <IconComponent className="w-3 h-3 mr-1" />
                      {getCategoryName(service.category)}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{formatCurrency(service.price)}</p>
                      <p className="text-xs text-muted-foreground">~{service.duration} menit</p>
                    </div>
                  </div>
                  <CardTitle className="font-serif text-base leading-tight">{service.name}</CardTitle>
                  <CardDescription className="text-sm">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {service.features && service.features.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-foreground mb-1">Bonus:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-accent rounded-full flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {isSelected && (
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      Terpilih
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="flex justify-end pt-6">
        <Button onClick={onNext} disabled={!selected} size="lg" className="px-8">
          Lanjutkan ke Waktu & Lokasi
        </Button>
      </div>
    </div>
  )
}
