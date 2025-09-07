"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, MapPin, Calendar, Clock, Copy, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { BookingData } from "@/app/booking/page"
import { useMemo, useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"

interface PaymentInfoProps {
  onNext: () => void
  onPrev: () => void
  bookingData: BookingData
  updateBookingData: (data: Partial<BookingData>) => void
}

export function PaymentInfo({ onNext, onPrev, bookingData, updateBookingData }: PaymentInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [availablePoints, setAvailablePoints] = useState(0)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  if (!bookingData.service || !bookingData.branch || !bookingData.date || !bookingData.time) {
    return <div>Data booking tidak lengkap</div>
  }

  const bookingDate = new Date(bookingData.date)
  const formattedDate = format(bookingDate, "EEEE, dd MMMM yyyy", { locale: id })

  const discount = (bookingData.loyaltyPointsUsed || 0) * 1000
  const totalPrice = useMemo(() => {
    return Math.max(
      0,
      bookingData.service!.price +
        (bookingData.isPickupService ? bookingData.service!.pickup_fee || 0 : 0) -
        discount,
    )
  }, [bookingData.service, bookingData.isPickupService, discount])

  const method = bookingData.paymentMethod || "transfer"

  useEffect(() => {
    const fetchPoints = async () => {
      if (bookingData.vehiclePlateNumber) {
        try {
          const res = await apiClient.getCustomers({
            vehiclePlateNumber: bookingData.vehiclePlateNumber,
          })
          if (res.customers && res.customers.length > 0) {
            setAvailablePoints(res.customers[0].total_loyalty_points)
          }
        } catch (err) {
          console.error("[v0] Failed to fetch customer points:", err)
        }
      }
    }
    fetchPoints()
  }, [bookingData.vehiclePlateNumber])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Pembayaran</h1>
        <p className="text-muted-foreground mt-1">Pilih metode pembayaran yang diinginkan</p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Ringkasan Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{bookingData.service.name}</h3>
              <p className="text-sm text-muted-foreground">{bookingData.service.description}</p>
              {bookingData.service.features && bookingData.service.features.length > 0 && (
                <div className="mt-2">
                  {bookingData.service.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="mr-1 mb-1 text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)}</p>
              {bookingData.loyaltyPointsUsed ? (
                <p className="text-xs text-muted-foreground">
                  Diskon poin: -{formatCurrency(discount)}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">~{bookingData.service.duration} menit</p>
              {bookingData.isPickupService && <p className="text-xs text-muted-foreground">Termasuk biaya pickup</p>}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{bookingData.branch.name}</p>
                <p className="text-sm text-muted-foreground">{bookingData.branch.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <p>{formattedDate}</p>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <p>{bookingData.time} WIB</p>
            </div>

            {bookingData.isPickupService && bookingData.pickupAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Alamat Pickup:</p>
                  <p className="text-sm text-muted-foreground">{bookingData.pickupAddress}</p>
                  {bookingData.pickupNotes && (
                    <p className="text-xs text-muted-foreground">Catatan: {bookingData.pickupNotes}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Metode Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="loyaltyPoints">Redeem Poin Loyalitas</Label>
            <p className="text-sm text-muted-foreground">Poin tersedia: {availablePoints}</p>
            <Input
              id="loyaltyPoints"
              type="number"
              min={0}
              max={availablePoints}
              value={bookingData.loyaltyPointsUsed || 0}
              onChange={(e) =>
                updateBookingData({ loyaltyPointsUsed: Number.parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>

          <div>
            <Select value={method} onValueChange={(v: any) => updateBookingData({ paymentMethod: v })}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Pilih metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Transfer Manual</SelectItem>
                <SelectItem value="cash">Bayar di Tempat (COD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {method === "transfer" ? (
            <div>
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-semibold text-primary mb-2">Transfer ke Rekening Berikut:</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bank:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bookingData.branch.bank_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bookingData.branch!.bank_name, "bank")}
                        className="h-6 w-6 p-0"
                      >
                        {copiedField === "bank" ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">No. Rekening:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono">{bookingData.branch.bank_account_number}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bookingData.branch!.bank_account_number, "account")}
                        className="h-6 w-6 p-0"
                      >
                        {copiedField === "account" ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Atas Nama:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bookingData.branch.bank_account_name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bookingData.branch!.bank_account_name, "name")}
                        className="h-6 w-6 p-0"
                      >
                        {copiedField === "name" ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Jumlah Transfer:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(totalPrice.toString(), "amount")}
                        className="h-6 w-6 p-0"
                      >
                        {copiedField === "amount" ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-800 mb-2">Penting:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Transfer sesuai dengan jumlah yang tertera</li>
                  <li>• Simpan bukti transfer untuk langkah selanjutnya</li>
                  <li>• Booking akan dikonfirmasi setelah pembayaran diverifikasi</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">Bayar di Tempat (COD)</h3>
              <p className="text-sm text-muted-foreground">
                Tunjukkan kode booking Anda saat tiba di cabang atau saat penjemputan. Pembayaran dilakukan di lokasi.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev} size="lg" className="px-8 bg-transparent">
          Kembali
        </Button>
        <Button onClick={onNext} size="lg" className="px-8">
          {method === "transfer" ? "Sudah Transfer, Lanjutkan" : "Lanjutkan"}
        </Button>
      </div>
    </div>
  )
}
