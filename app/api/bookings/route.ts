import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface CreateBookingInput {
  customer_name: string
  customer_phone: string
  customer_email: string
  service_id: string
  branch_id: string
  booking_date: string
  booking_time: string
  total_price: number
  is_pickup_service: boolean
  pickup_address?: string
  pickup_notes?: string
  vehicle_plate_number: string
  payment_method: string
  loyalty_points_used?: number
  notes?: string
  booking_source?: string
  created_by_admin?: boolean
}

function validateBookingInput(data: any): CreateBookingInput {
  const errors: string[] = []

  if (!data.customer_name?.trim()) errors.push("customer_name is required")
  if (!data.customer_phone?.trim()) errors.push("customer_phone is required")
  if (!data.customer_email?.trim()) errors.push("customer_email is required")
  if (!data.service_id?.trim()) errors.push("service_id is required")
  if (!data.branch_id?.trim()) errors.push("branch_id is required")
  if (!data.booking_date?.trim()) errors.push("booking_date is required")
  if (!data.booking_time?.trim()) errors.push("booking_time is required")
  if (typeof data.total_price !== "number" || data.total_price <= 0)
    errors.push("total_price must be a positive number")
  if (typeof data.is_pickup_service !== "boolean") errors.push("is_pickup_service must be a boolean")
  if (!data.vehicle_plate_number?.trim()) errors.push("vehicle_plate_number is required")
  if (!data.payment_method?.trim()) errors.push("payment_method is required")

  // Validasi format tanggal (YYYY-MM-DD)
  if (data.booking_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.booking_date)) {
    errors.push("booking_date must be in YYYY-MM-DD format")
  }

  // Validasi format jam (HH:MM)
  if (data.booking_time && !/^\d{2}:\d{2}$/.test(data.booking_time)) {
    errors.push("booking_time must be in HH:MM format")
  }

  // Validasi format email
  if (data.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email)) {
    errors.push("customer_email must be a valid email address")
  }

  // Validasi format telepon
  if (data.customer_phone && !/^(\+62|62|0)[0-9]{9,13}$/.test(data.customer_phone.replace(/\s/g, ""))) {
    errors.push("customer_phone must be a valid Indonesian phone number")
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`)
  }

  return data as CreateBookingInput
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    const status = searchParams.get("status")
    const date = searchParams.get("date")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const limit = searchParams.get("limit")
    const page = searchParams.get("page")
    const search = searchParams.get("search")
    const getAll = searchParams.get("all") === "true"

    const supabase = createClient()
    let query = supabase
      .from("bookings")
      .select(
        `*,
        services (name, category, price, duration, pickup_fee),
        branches (name, address, phone)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })

    if (branchId) {
      query = query.eq("branch_id", branchId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (date) {
      query = query.eq("booking_date", date)
    }

    if (dateFrom) {
      query = query.gte("booking_date", dateFrom)
    }

    if (dateTo) {
      query = query.lte("booking_date", dateTo)
    }

    if (!getAll) {
      const limitNum = limit ? Number.parseInt(limit) : 10
      const pageNum = page ? Number.parseInt(page) : 1
      const from = (pageNum - 1) * limitNum
      const to = from + limitNum - 1
      query = query.range(from, to)
    }

    if (search) {
      query = query.or(
        `booking_code.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`,
      )
    }

    const { data: bookings, error, count } = await query

    if (error) {
      console.error("[v0] Database error in GET /api/bookings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookings: bookings || [], total: count || 0 })
  } catch (error) {
    console.error("[v0] Get bookings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json()

    const bookingData = validateBookingInput(rawData)

    const supabase = createClient()

    const now = new Date()
    const bookingCode = `BCW${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`

    const { data: serviceRecord } = await supabase
      .from("services")
      .select("loyalty_points_reward")
      .eq("id", bookingData.service_id)
      .single()

    const loyaltyPointsEarned =
      serviceRecord?.loyalty_points_reward ?? Math.floor(bookingData.total_price / 10000)

    const insertData = {
      ...bookingData,
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      booking_code: bookingCode,
      status: "pending",
      loyalty_points_used: bookingData.loyalty_points_used || 0,
      loyalty_points_earned: loyaltyPointsEarned,
      booking_source: bookingData.booking_source || "website",
      created_by_admin: bookingData.created_by_admin || false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert(insertData)
      .select(`
        *,
        services (name, category, price, duration, pickup_fee),
        branches (name, address, phone)
      `)
      .single()

    if (error) {
      console.error("[v0] Database error in POST /api/bookings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    try {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", bookingData.customer_phone)
        .single()

      let customerId: string

      if (existingCustomer) {
        // Update data customer lama
        const updatedPlateNumbers = Array.from(
          new Set([...existingCustomer.vehicle_plate_numbers, bookingData.vehicle_plate_number]),
        )

        await supabase
          .from("customers")
          .update({
            name: bookingData.customer_name,
            email: bookingData.customer_email,
            vehicle_plate_numbers: updatedPlateNumbers,
            total_bookings: existingCustomer.total_bookings + 1,
            total_loyalty_points: Math.max(
              0,
              existingCustomer.total_loyalty_points - (bookingData.loyalty_points_used || 0),
            ),
            updated_at: now.toISOString(),
          })
          .eq("id", existingCustomer.id)
        customerId = existingCustomer.id
      } else {
        // Buat customer baru
        customerId = `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        await supabase.from("customers").insert({
          id: customerId,
          name: bookingData.customer_name,
          phone: bookingData.customer_phone,
          email: bookingData.customer_email,
          vehicle_plate_numbers: [bookingData.vehicle_plate_number],
          join_date: now.toISOString().split("T")[0],
          total_bookings: 1,
          total_loyalty_points: 0,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
      }

      if (bookingData.loyalty_points_used) {
        await supabase.from("loyalty_transactions").insert({
          customer_id: customerId,
          booking_id: insertData.id,
          points: bookingData.loyalty_points_used,
          type: "redeem",
        })
      }
    } catch (customerError) {
      console.error("[v0] Error updating customer:", customerError)
      // Abaikan jika update customer gagal; booking tetap lanjut
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create booking error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
