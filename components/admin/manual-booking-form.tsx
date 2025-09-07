"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormInput } from "./form-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Car, MapPin, FileText, CalendarIcon, Clock, CreditCard, X, CheckCircle } from "lucide-react"
import { format, startOfDay } from "date-fns"
import { id } from "date-fns/locale"
import { cn, normalizeVehiclePlate } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
import type { Service, Branch, CreateBookingData } from "@/lib/api-client"

interface ManualBookingFormProps {
  onSuccess: (bookingCode: string, loyaltyPoints: number) => void
  onCancel: () => void
}

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceId: string;
  branchId: string;
  date: Date | undefined;
  time: string;
  vehiclePlateNumber: string;
  isPickupService: boolean;
  pickupAddress: string;
  pickupNotes: string;
  paymentMethod: "cash" | "transfer" | "qris" | "card";
  notes: string;
}

export function ManualBookingForm({ onSuccess, onCancel }: ManualBookingFormProps) {
  const [services, setServices] = useState<Service[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceId: "",
    branchId: "",
    date: undefined,
    time: "",
    vehiclePlateNumber: "",
    isPickupService: false,
    pickupAddress: "",
    pickupNotes: "",
    paymentMethod: "cash",
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [servicesData, branchesData] = await Promise.all([apiClient.getServices(), apiClient.getBranches()])

        console.log("[v0] Fetched services:", servicesData)
        console.log("[v0] Fetched branches:", branchesData)

        setServices(servicesData.services) // Access the services array from the response
        setBranches(branchesData.branches.filter((branch: Branch) => branch.status === "active"))
      } catch (err) {
        console.error("[v0] Error fetching form data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const selectedService = services.find((s) => s.id === formData.serviceId)
  const selectedBranch = branches.find((b) => b.id === formData.branchId)

  const timeSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Nama pelanggan wajib diisi"
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

    if (!formData.serviceId) {
      newErrors.serviceId = "Layanan wajib dipilih"
    }

    if (!formData.branchId) {
      newErrors.branchId = "Cabang wajib dipilih"
    }

    if (!formData.date) {
      newErrors.date = "Tanggal wajib dipilih"
    }

    if (!formData.time) {
      newErrors.time = "Waktu wajib dipilih"
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

  type InputValue = string | boolean | Date | undefined;

  const handleInputChange = useCallback((field: keyof typeof formData, value: InputValue) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }, [])

  const calculateTotalPrice = () => {
    if (!selectedService) return 0
    const basePrice = selectedService.price
    const pickupFee = formData.isPickupService ? selectedService.pickup_fee || 0 : 0
    return basePrice + pickupFee
  }

  const calculateLoyaltyPoints = (amount: number): number => {
    return Math.floor(amount / 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const totalPrice = calculateTotalPrice()
      const loyaltyPoints = calculateLoyaltyPoints(totalPrice)

      const bookingData: CreateBookingData = {
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_email: formData.customerEmail,
        service_id: formData.serviceId,
        branch_id: formData.branchId,
        booking_date: format(formData.date!, "yyyy-MM-dd"),
        booking_time: formData.time,
        total_price: totalPrice,
        is_pickup_service: formData.isPickupService,
        pickup_address: formData.pickupAddress || undefined,
        pickup_notes: formData.pickupNotes || undefined,
        vehicle_plate_number: formData.vehiclePlateNumber,
        payment_method: formData.paymentMethod,
        notes: formData.notes || undefined,
        booking_source: "offline",
        created_by_admin: true
      }

      const newBooking = await apiClient.createBooking(bookingData)
      onSuccess(newBooking.booking.booking_code, newBooking.booking.loyalty_points_earned)
    } catch (error) {
      console.error("[v0] Error creating booking:", error)
      // You could add error handling/toast notification here
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">Buat Booking Manual</h2>
            <p className="text-muted-foreground mt-1">Memuat data...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Buat Booking Manual</h2>
          <p className="text-muted-foreground mt-1">Buat booking untuk layanan offline/walk-in</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Batal
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <User className="w-5 h-5" />
              Informasi Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput
                id="customerName"
                label="Nama Lengkap"
                value={formData.customerName}
                onChange={(value) => handleInputChange("customerName", value)}
                placeholder="Masukkan nama pelanggan"
                error={errors.customerName}
                required
              />

              <FormInput
                id="customerPhone"
                label="Nomor Telepon"
                value={formData.customerPhone}
                onChange={(value) => handleInputChange("customerPhone", value)}
                placeholder="08123456789"
                error={errors.customerPhone}
                required
              />
            </div>

            <FormInput
              id="customerEmail"
              label="Email"
              value={formData.customerEmail}
              onChange={(value) => handleInputChange("customerEmail", value)}
              placeholder="contoh@email.com"
              type="email"
              error={errors.customerEmail}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="vehiclePlateNumber">Nomor Plat Kendaraan *</Label>
              <Input
                id="vehiclePlateNumber"
                value={formData.vehiclePlateNumber}
                onChange={(e) =>
                  handleInputChange(
                    "vehiclePlateNumber",
                    normalizeVehiclePlate(e.target.value),
                  )
                }
                placeholder="B 1234 ABC"
                className={errors.vehiclePlateNumber ? "border-destructive" : ""}
              />
              {errors.vehiclePlateNumber && <p className="text-sm text-destructive">{errors.vehiclePlateNumber}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Service Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Car className="w-5 h-5" />
              Pilih Layanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Layanan *</Label>
              <Select value={formData.serviceId} onValueChange={(value) => handleInputChange("serviceId", value)}>
                <SelectTrigger className={errors.serviceId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Pilih layanan" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(service.category)} variant="secondary">
                            {getCategoryName(service.category)}
                          </Badge>
                          <span>{service.name}</span>
                        </div>
                        <span className="font-semibold text-primary ml-4">{formatCurrency(service.price)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceId && <p className="text-sm text-destructive">{errors.serviceId}</p>}
            </div>

            {selectedService && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{selectedService.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{formatCurrency(selectedService.price)}</p>
                    <p className="text-sm text-muted-foreground">~{selectedService.duration} menit</p>
                  </div>
                </div>
                {selectedService.features && selectedService.features.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Bonus:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedService.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch and Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Cabang & Jadwal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cabang *</Label>
              <Select value={formData.branchId} onValueChange={(value) => handleInputChange("branchId", value)}>
                <SelectTrigger className={errors.branchId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Pilih cabang" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-sm text-muted-foreground">{branch.address}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branchId && <p className="text-sm text-destructive">{errors.branchId}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground",
                        errors.date && "border-destructive",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => handleInputChange("date", date)}
                      disabled={(d) => d < startOfDay(new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
              </div>

              <div className="space-y-2">
                <Label>Waktu *</Label>
                <Select value={formData.time} onValueChange={(value) => handleInputChange("time", value)}>
                  <SelectTrigger className={errors.time ? "border-destructive" : ""}>
                    <SelectValue placeholder="Pilih waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time} WIB
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Service */}
        {selectedService?.supports_pickup && (
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Layanan Pickup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPickupService"
                  checked={formData.isPickupService}
                  onCheckedChange={(checked) => handleInputChange("isPickupService", checked)}
                />
                <Label htmlFor="isPickupService" className="cursor-pointer">
                  Gunakan layanan pickup (+{formatCurrency(selectedService.pickup_fee || 0)})
                </Label>
              </div>

              {formData.isPickupService && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="pickupAddress">Alamat Pickup *</Label>
                    <Textarea
                      id="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={(e) => handleInputChange("pickupAddress", e.target.value)}
                      placeholder="Masukkan alamat lengkap untuk pickup"
                      className={errors.pickupAddress ? "border-destructive" : ""}
                      rows={3}
                    />
                    {errors.pickupAddress && <p className="text-sm text-destructive">{errors.pickupAddress}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickupNotes">Catatan Pickup</Label>
                    <Textarea
                      id="pickupNotes"
                      value={formData.pickupNotes}
                      onChange={(e) => handleInputChange("pickupNotes", e.target.value)}
                      placeholder="Petunjuk lokasi atau catatan khusus"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Informasi Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: "cash" | "transfer" | "qris" | "card") =>
                  handleInputChange("paymentMethod", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="card">Kartu Debit/Kredit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>Harga Layanan:</span>
                <span>{formatCurrency(selectedService?.price || 0)}</span>
              </div>
              {formData.isPickupService && selectedService?.pickup_fee && (
                <div className="flex justify-between items-center mb-2">
                  <span>Biaya Pickup:</span>
                  <span>{formatCurrency(selectedService.pickup_fee)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(calculateTotalPrice())}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Poin loyalitas: +{calculateLoyaltyPoints(calculateTotalPrice())} poin
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Catatan Tambahan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Catatan khusus untuk booking ini..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting} className="px-8">
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Membuat Booking...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Buat Booking
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
