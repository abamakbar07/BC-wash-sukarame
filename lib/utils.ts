import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid, parse } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date/Time Formatting Utilities
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date: string | Date, formatStr = "dd MMM yyyy"): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) {
      console.error("[v0] Invalid date provided to formatDate:", date)
      return "Invalid Date"
    }
    return format(dateObj, formatStr, { locale: id })
  } catch (error) {
    console.error("[v0] Error formatting date:", error)
    return "Invalid Date"
  }
}

export const formatTime = (time: string, formatStr = "HH:mm"): string => {
  try {
    // Handle both "HH:MM" and "HH:MM:SS" formats
    const timeRegex = /^(\d{2}):(\d{2})(?::(\d{2}))?$/
    const match = time.match(timeRegex)

    if (!match) {
      console.error("[v0] Invalid time format provided to formatTime:", time)
      return "Invalid Time"
    }

    const [, hours, minutes, seconds = "00"] = match
    const timeString = `${hours}:${minutes}:${seconds}`
    const dateWithTime = parse(timeString, "HH:mm:ss", new Date())

    if (!isValid(dateWithTime)) {
      console.error("[v0] Invalid time provided to formatTime:", time)
      return "Invalid Time"
    }

    return format(dateWithTime, formatStr)
  } catch (error) {
    console.error("[v0] Error formatting time:", error)
    return "Invalid Time"
  }
}

export const formatDateTime = (date: string | Date, time?: string): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) {
      return "Invalid DateTime"
    }

    const formattedDate = format(dateObj, "dd MMM yyyy", { locale: id })

    if (time) {
      const formattedTime = formatTime(time, "HH:mm")
      return `${formattedDate}, ${formattedTime} WIB`
    }

    return formattedDate
  } catch (error) {
    console.error("[v0] Error formatting datetime:", error)
    return "Invalid DateTime"
  }
}

export const formatDateForInput = (date: string | Date): string => {
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date
    if (!isValid(dateObj)) {
      return ""
    }
    return format(dateObj, "yyyy-MM-dd")
  } catch (error) {
    console.error("[v0] Error formatting date for input:", error)
    return ""
  }
}

export const formatTimeForInput = (time: string): string => {
  try {
    const timeRegex = /^(\d{2}):(\d{2})(?::(\d{2}))?$/
    const match = time.match(timeRegex)

    if (!match) {
      return ""
    }

    const [, hours, minutes] = match
    return `${hours}:${minutes}`
  } catch (error) {
    console.error("[v0] Error formatting time for input:", error)
    return ""
  }
}

// Validation Utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export const validatePhoneNumber = (phone: string): boolean => {
  // Indonesian phone number format: +62, 62, or 0 followed by 9-13 digits
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export const validateDate = (date: string): boolean => {
  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return false
  }

  try {
    const dateObj = parseISO(date)
    return isValid(dateObj)
  } catch {
    return false
  }
}

export const validateTime = (time: string): boolean => {
  // Validate HH:MM format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

export const validateVehiclePlate = (plate: string): boolean => {
  // Indonesian vehicle plate format: 1-2 letters, 1-4 digits, 1-3 letters
  const plateRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{1,3}$/i
  return plateRegex.test(plate.trim())
}

export const validateBookingTime = (date: string, time: string): { isValid: boolean; error?: string } => {
  if (!validateDate(date)) {
    return { isValid: false, error: "Invalid date format" }
  }

  if (!validateTime(time)) {
    return { isValid: false, error: "Invalid time format" }
  }

  try {
    const bookingDateTime = parseISO(`${date}T${time}:00`)
    const now = new Date()

    if (bookingDateTime <= now) {
      return { isValid: false, error: "Booking time must be in the future" }
    }

    // Check if booking is within business hours (8:00 - 18:00)
    const hour = bookingDateTime.getHours()
    if (hour < 8 || hour >= 18) {
      return { isValid: false, error: "Booking time must be between 08:00 and 18:00" }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: "Invalid date/time combination" }
  }
}

// Data Transformation Utilities
export const normalizePhoneNumber = (phone: string): string => {
  // Remove all spaces and normalize to +62 format
  const cleaned = phone.replace(/\s/g, "")

  if (cleaned.startsWith("0")) {
    return `+62${cleaned.substring(1)}`
  } else if (cleaned.startsWith("62")) {
    return `+${cleaned}`
  } else if (cleaned.startsWith("+62")) {
    return cleaned
  }

  return phone // Return original if format is unrecognized
}

export const normalizeVehiclePlate = (plate: string): string => {
  // Normalize vehicle plate to uppercase without any spaces
  return plate.replace(/\s+/g, "").toUpperCase()
}

export const generateBookingCode = (): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const date = now.getDate().toString().padStart(2, "0")
  const hours = now.getHours().toString().padStart(2, "0")
  const minutes = now.getMinutes().toString().padStart(2, "0")
  const seconds = now.getSeconds().toString().padStart(2, "0")

  return `BCW${year}${month}${date}${hours}${minutes}${seconds}`
}

export const calculateLoyaltyPoints = (amount: number): number => {
  // 1 point for every 10,000 IDR spent
  return Math.floor(amount / 10000)
}

// Status Badge Utilities
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "confirmed":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "in-progress":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100"
    case "completed":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
  }
}

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "pending":
      return "Menunggu"
    case "confirmed":
      return "Dikonfirmasi"
    case "in-progress":
      return "Berlangsung"
    case "completed":
      return "Selesai"
    case "cancelled":
      return "Dibatalkan"
    default:
      return status
  }
}

// Error Handling Utilities
export const createValidationError = (field: string, message: string) => {
  return new Error(`Validation failed for ${field}: ${message}`)
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "An unexpected error occurred"
}

// Type Guards
export const isValidBookingStatus = (
  status: string,
): status is "pending" | "confirmed" | "picked-up" | "in-progress" | "completed" | "cancelled" => {
  return ["pending", "confirmed", "picked-up", "in-progress", "completed", "cancelled"].includes(status)
}

export const isValidPaymentMethod = (method: string): method is "cash" | "transfer" | "qris" | "card" => {
  return ["cash", "transfer", "qris", "card"].includes(method)
}
