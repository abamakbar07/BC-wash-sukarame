"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Phone, Mail, Car, MapPin, FileText, Clock, Info } from "lucide-react"
import type { Service } from "@/lib/api-client"
import { normalizePlate } from "@/lib/normalizePlate"
import { PickupAddressInput } from "@/components/booking/pickup-address-input"

interface CustomerInfoProps {
  onNext: () => void
  onPrev: () => void
  onSubmit: (data: {
    customerName: string
    customerPhone: string
    customerEmail: string
    vehiclePlateNumber: string
    isPickupService: boolean
    pickupAddress?: string
    pickupNotes?: string
  }) => void
  initialData?: {
    customerName?: string
    customerPhone?: string
    customerEmail?: string
    vehiclePlateNumber?: string
    isPickupService?: boolean
    pickupAddress?: string
    pickupNotes?: string
  }
  selectedService?: Service
  selectedBranch?: { id: string; name: string; pickup_coverage_radius?: number; latitude?: number | null; longitude?: number | null }
}

export function CustomerInfo({
  onNext,
  onPrev,
  onSubmit,
  initialData,
  selectedService,
  selectedBranch,
}: CustomerInfoProps) {
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || "",
    customerPhone: initialData?.customerPhone || "",
    customerEmail: initialData?.customerEmail || "",
    vehiclePlateNumber: initialData?.vehiclePlateNumber || "",
    isPickupService: initialData?.isPickupService || false,
    pickupAddress: initialData?.pickupAddress || "",
    pickupNotes: initialData?.pickupNotes || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pickupWithinRadius, setPickupWithinRadius] = useState(true)

  const supportsPickup = selectedService?.supports_pickup ?? false
  const pickupFee = selectedService?.pickup_fee ?? 0

  useEffect(() => {
    if (!supportsPickup && formData.isPickupService) {
      setFormData((prev) => ({
        ...prev,
        isPickupService: false,
      }))
    }
  }, [supportsPickup, formData.isPickupService])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Nama lengkap wajib diisi"
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "Nomor telepon wajib diisi"
    } else if (!/^(\+62|62|0)[0-9]{9,13}$/.test(formData.customerPhone.replace(/\s/g, ""))) {
      newErrors.customerPhone = "Format nomor telepon tidak valid"
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email wajib diisi"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Format email tidak valid"
    }

    if (!formData.vehiclePlateNumber.trim()) {
      newErrors.vehiclePlateNumber = "Nomor plat kendaraan wajib diisi"
    }

    if (formData.isPickupService && !formData.pickupAddress.trim()) {
      newErrors.pickupAddress = "Alamat pickup wajib diisi untuk layanan pickup"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
      onNext()
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Data Diri</h1>
        <p className="text-muted-foreground mt-1">Lengkapi informasi kontak dan kendaraan Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Informasi Kontak</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nama Lengkap
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                value={formData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                className={errors.customerName ? "border-destructive" : ""}
              />
              {errors.customerName && <p className="text-sm text-destructive">{errors.customerName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Nomor Telepon
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="Contoh: 08123456789"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                className={errors.customerPhone ? "border-destructive" : ""}
              />
              {errors.customerPhone && <p className="text-sm text-destructive">{errors.customerPhone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="contoh@email.com"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                className={errors.customerEmail ? "border-destructive" : ""}
              />
              {errors.customerEmail && <p className="text-sm text-destructive">{errors.customerEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehiclePlateNumber" className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Nomor Plat Kendaraan
              </Label>
              <Input
                id="vehiclePlateNumber"
                type="text"
                placeholder="Contoh: B 1234 ABC"
                value={formData.vehiclePlateNumber}
                onChange={(e) => handleInputChange("vehiclePlateNumber", normalizePlate(e.target.value))}
                className={errors.vehiclePlateNumber ? "border-destructive" : ""}
              />
              {errors.vehiclePlateNumber && <p className="text-sm text-destructive">{errors.vehiclePlateNumber}</p>}
              <p className="text-xs text-muted-foreground">Nomor plat akan digunakan untuk sistem poin loyalitas</p>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-cyan-50 to-purple-50 border-cyan-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPickupService"
                  checked={formData.isPickupService}
                  onCheckedChange={(checked) => handleInputChange("isPickupService", checked as boolean)}
                  disabled={!supportsPickup}
                />
                <Label
                  htmlFor="isPickupService"
                  className={`flex items-center gap-2 font-medium ${supportsPickup ? "cursor-pointer" : "text-muted-foreground"}`}
                >
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  {supportsPickup ? "Layanan Pickup" : "Layanan pickup tidak tersedia"}
                  {supportsPickup && (
                    <span className="ml-1">
                      (+
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(pickupFee)}
                      )
                    </span>
                  )}
                </Label>
              </div>

              <div className="bg-white/70 p-3 rounded-md border border-cyan-100">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="w-4 h-4 text-cyan-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-cyan-800">
                      {supportsPickup ? "Layanan pickup tersedia" : "Layanan pickup belum tersedia untuk layanan ini"}
                    </p>
                    <p className="text-muted-foreground">
                      {supportsPickup
                        ? "Tim kami akan menjemput kendaraan Anda di lokasi yang ditentukan"
                        : "Pilih layanan lain atau lanjutkan tanpa pickup"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Koordinasi waktu pickup akan dilakukan setelah konfirmasi pembayaran</span>
                </div>

                <div className="mt-2 text-xs text-cyan-700 bg-cyan-50 p-2 rounded border border-cyan-100">
                  <strong>Area Layanan:</strong> Radius {selectedBranch?.pickup_coverage_radius ?? "-"} km dari {selectedBranch?.name || "cabang yang dipilih"}
                </div>
              </div>

            {formData.isPickupService && (
              <div className="space-y-4 bg-white/70 p-4 rounded-md border border-cyan-100">
                  <PickupAddressInput
                    branchId={selectedBranch?.id || ""}
                    branchName={selectedBranch?.name || "Cabang"}
                    radiusKm={selectedBranch?.pickup_coverage_radius}
                    branchLat={selectedBranch?.latitude ?? undefined}
                    branchLng={selectedBranch?.longitude ?? undefined}
                    value={formData.pickupAddress}
                    onChange={(val) => handleInputChange("pickupAddress", val)}
                    onValidationChange={(ok) => setPickupWithinRadius(ok)}
                  />
                  {errors.pickupAddress && <p className="text-sm text-destructive">{errors.pickupAddress}</p>}

                  <div className="space-y-2">
                    <Label htmlFor="pickupNotes" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Catatan Pickup (Opsional)
                    </Label>
                    <Textarea
                      id="pickupNotes"
                      placeholder="Contoh: Rumah cat hijau, pagar putih, sebelah warung"
                      value={formData.pickupNotes}
                      onChange={(e) => handleInputChange("pickupNotes", e.target.value)}
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Berikan petunjuk yang memudahkan tim kami menemukan lokasi
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={onPrev} size="lg" className="px-8 bg-transparent">
                Kembali
              </Button>
              <Button type="submit" size="lg" className="px-8" disabled={formData.isPickupService && !pickupWithinRadius}>
                Lanjutkan ke Pembayaran
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
