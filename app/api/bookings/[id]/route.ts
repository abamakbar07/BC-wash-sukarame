import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        services (name, category, price, duration, pickup_fee, features),
        branches (name, address, phone, operating_hours_open, operating_hours_close)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("[v0] Database error in GET /api/bookings/[id]:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("[v0] Get booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updateData = await request.json()

    const allowedFields = [
      "status",
      "payment_proof",
      "notes",
      "booking_date",
      "booking_time",
      "total_price",
      "is_pickup_service",
      "pickup_address",
      "pickup_notes",
      "payment_method",
      "loyalty_points_used",
    ]

    const filteredData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    filteredData.updated_at = new Date().toISOString()

    const supabase = createClient()

    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .update(filteredData)
      .eq("id", params.id)
      .select(`
        *,
        services (name, category, price, duration, pickup_fee, features),
        branches (name, address, phone, operating_hours_open, operating_hours_close)
      `)
      .single()

    if (error) {
      console.error("[v0] Database error in PUT /api/bookings/[id]:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (filteredData.status === "completed" && existingBooking.status !== "completed") {
      const { data: customer } = await supabase
        .from("customers")
        .select("id, total_loyalty_points")
        .contains("vehicle_plate_numbers", [existingBooking.vehicle_plate_number])
        .single()

      if (customer) {
        await supabase
          .from("customers")
          .update({
            total_loyalty_points: customer.total_loyalty_points + existingBooking.loyalty_points_earned,
          })
          .eq("id", customer.id)

        await supabase.from("loyalty_transactions").insert({
          customer_id: customer.id,
          vehicle_plate_number: existingBooking.vehicle_plate_number,
          booking_id: existingBooking.id,
          points: existingBooking.loyalty_points_earned,
          type: "earn",
        })
      }
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("[v0] Update booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { data: existingBooking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (!["pending", "cancelled"].includes(existingBooking.status)) {
      return NextResponse.json(
        {
          error: "Cannot delete booking with status: " + existingBooking.status,
        },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("bookings").delete().eq("id", params.id)

    if (error) {
      console.error("[v0] Database error in DELETE /api/bookings/[id]:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
