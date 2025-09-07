import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeVehiclePlate } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")
    const vehiclePlate = searchParams.get("vehiclePlateNumber")
    const search = searchParams.get("search")
    const limit = searchParams.get("limit")
    const page = searchParams.get("page")

    const supabase = createClient()

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order("join_date", { ascending: false })

    if (phone) {
      query = query.eq("phone", phone)
    }

    if (vehiclePlate) {
      query = query.contains("vehicle_plate_numbers", [normalizeVehiclePlate(vehiclePlate)])
    }

    if (search) {
      const normalizedPlate = normalizeVehiclePlate(search)
      const filters = [`name.ilike.%${search}%`, `phone.ilike.%${search}%`]
      if (normalizedPlate) {
        filters.push(`vehicle_plate_numbers.cs.{${normalizedPlate}}`)
      }
      query = query.or(filters.join(","))
    }

    const limitNum = limit ? Number.parseInt(limit) : 10
    const pageNum = page ? Number.parseInt(page) : 1
    const from = (pageNum - 1) * limitNum
    const to = from + limitNum - 1
    query = query.range(from, to)

    const { data: customers, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customers: customers || [], total: count || 0 })
  } catch (error) {
    console.error("Get customers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const customerData = await request.json()

    const supabase = createClient()

    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        ...customerData,
        id: `customer-${Date.now()}`,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customer }, { status: 201 })
  } catch (error) {
    console.error("Create customer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
