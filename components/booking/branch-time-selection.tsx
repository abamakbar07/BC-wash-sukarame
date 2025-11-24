"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { MapPin, Clock, Phone } from "lucide-react"
import { apiClient, type Branch } from "@/lib/api-client"
import { format, addDays, isToday, isTomorrow, startOfDay } from "date-fns"
import { id } from "date-fns/locale"
import { ErrorState } from "@/components/ui/error-state"
import { showErrorToast } from "@/lib/error-utils"

interface BranchTimeSelectionProps {
  onNext: () => void
  onPrev: () => void
  onSelect: (branch: Branch, date: string, time: string) => void
  selectedBranch?: Branch
  selectedDate?: string
  selectedTime?: string
}

export function BranchTimeSelection({
  onNext,
  onPrev,
  onSelect,
  selectedBranch,
  selectedDate,
  selectedTime,
}: BranchTimeSelectionProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [branch, setBranch] = useState<Branch | undefined>(selectedBranch)
  const [date, setDate] = useState<Date | undefined>(selectedDate ? new Date(selectedDate) : undefined)
  const [time, setTime] = useState<string | undefined>(selectedTime)
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  useEffect(() => {
    if (branch) {
      const slots = generateTimeSlots(branch.operating_hours_open, branch.operating_hours_close)
      setTimeSlots(slots)
      if (time && !slots.includes(time)) {
        setTime(undefined)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch])

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    let isCancelled = false

    const fetchBookedSlots = async () => {
      if (!branch || !date) {
        setBookedTimeSlots([])
        setBookingsError(null)
        return
      }

      const requestBranchId = branch.id
      const requestDate = format(date, "yyyy-MM-dd")

      try {
        setBookingsLoading(true)
        setBookingsError(null)

        const { bookings } = await apiClient.getBookings({
          branchId: requestBranchId,
          date: requestDate,
          limit: 1000,
        })

        if (
          isCancelled ||
          requestBranchId !== branch?.id ||
          (date && format(date, "yyyy-MM-dd") !== requestDate)
        ) {
          return
        }

        const bookedSlots = Array.from(new Set(bookings.map((booking) => booking.booking_time)))
        setBookedTimeSlots(bookedSlots)

        if (time && bookedSlots.includes(time)) {
          setTime(undefined)
        }
      } catch (err) {
        console.error("[v0] Error fetching booked slots:", err)
        const errorMessage = "Gagal memuat jadwal yang sudah dibooking"
        if (!isCancelled) {
          setBookingsError(errorMessage)
        }
        showErrorToast(err, "Gagal Memuat Jadwal")
      } finally {
        if (!isCancelled) {
          setBookingsLoading(false)
        }
      }
    }

    const guardedFetch = async () => {
      if (isCancelled) return
      await fetchBookedSlots()
    }

    guardedFetch()

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, date])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      setError(null)

      const { branches: branchesData } = await apiClient.getBranches()
      const activeBranches = branchesData.filter((b) => b.status === "active")
      setBranches(activeBranches)
    } catch (err) {
      console.error("[v0] Error fetching branches:", err)
      const errorMessage = "Gagal memuat data cabang"
      setError(errorMessage)
      showErrorToast(err, "Gagal Memuat Cabang")
    } finally {
      setLoading(false)
    }
  }

  const handleBranchSelect = (selectedBranch: Branch) => {
    setBranch(selectedBranch)

    const slots = generateTimeSlots(
      selectedBranch.operating_hours_open,
      selectedBranch.operating_hours_close,
    )
    setTimeSlots(slots)

    if (time && !slots.includes(time)) {
      setTime(undefined)
    }

    if (date && time && slots.includes(time)) {
      onSelect(selectedBranch, format(date, "yyyy-MM-dd"), time)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (branch && selectedDate && time) {
      onSelect(branch, format(selectedDate, "yyyy-MM-dd"), time)
    }
  }

  const handleTimeSelect = (selectedTime: string) => {
    if (bookedTimeSlots.includes(selectedTime)) return

    setTime(selectedTime)
    if (branch && date) {
      onSelect(branch, format(date, "yyyy-MM-dd"), selectedTime)
    }
  }

  const generateTimeSlots = (open: string, close: string) => {
    try {
      const [openH, openM] = open.split(":").map(Number)
      const [closeH, closeM] = close.split(":").map(Number)
      const start = new Date()
      start.setHours(openH, openM, 0, 0)
      const end = new Date()
      end.setHours(closeH, closeM, 0, 0)

      const slots: string[] = []
      const current = new Date(start)
      while (current < end) {
        slots.push(format(current, "HH:mm"))
        current.setMinutes(current.getMinutes() + 30)
      }
      return slots
    } catch (err) {
      console.error("[v0] Failed to generate time slots:", err)
      return []
    }
  }

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Hari Ini"
    if (isTomorrow(date)) return "Besok"
    return format(date, "EEEE, dd MMMM yyyy", { locale: id })
  }

  const canProceed = branch && date && time

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Pilih Waktu & Lokasi</h1>
          <p className="text-muted-foreground mt-1">Memuat data cabang...</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
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
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Pilih Waktu & Lokasi</h1>
          <p className="text-muted-foreground mt-1">Tentukan cabang dan jadwal kunjungan Anda</p>
        </div>
        <ErrorState title="Gagal Memuat Cabang" message={error} onRetry={fetchBranches} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Pilih Waktu & Lokasi</h1>
        <p className="text-muted-foreground mt-1">Tentukan cabang dan jadwal kunjungan Anda</p>
      </div>

      {/* pilih cabang */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-semibold">Pilih Cabang</h2>
        {branches.length === 0 ? (
          <ErrorState
            title="Cabang Tidak Tersedia"
            message="Saat ini tidak ada cabang yang tersedia untuk booking."
            showRetry={false}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {branches.map((branchOption) => (
              <Card
                key={branchOption.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  branch?.id === branchOption.id ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
                onClick={() => handleBranchSelect(branchOption)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {branchOption.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{branchOption.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{branchOption.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {branchOption.operating_hours_open} - {branchOption.operating_hours_close} WIB
                    </span>
                  </div>
                  {branch?.id === branchOption.id && (
                    <div className="flex items-center gap-2 text-primary text-sm font-medium pt-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      Terpilih
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* pilih tanggal */}
      {branch && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">Pilih Tanggal</h2>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(d) => d < startOfDay(new Date()) || d > addDays(startOfDay(new Date()), 30)}
              className="rounded-md border"
              locale={id}
            />
          </div>
          {date && <p className="text-center text-sm text-muted-foreground">Tanggal terpilih: {getDateLabel(date)}</p>}
        </div>
      )}

      {/* pilih waktu */}
      {branch && date && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">Pilih Waktu</h2>
          {bookingsError && (
            <p className="text-sm text-destructive">{bookingsError}</p>
          )}
          {bookingsLoading && (
            <p className="text-sm text-muted-foreground">Memuat jadwal yang telah dibooking...</p>
          )}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {timeSlots.map((timeSlot) => (
              <Button
                key={timeSlot}
                variant={time === timeSlot ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeSelect(timeSlot)}
                className="text-sm"
                disabled={bookedTimeSlots.includes(timeSlot)}
              >
                {timeSlot}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev} size="lg" className="px-8 bg-transparent">
          Kembali
        </Button>
        <Button onClick={onNext} disabled={!canProceed} size="lg" className="px-8">
          Lanjutkan ke Data Diri
        </Button>
      </div>
    </div>
  )
}
