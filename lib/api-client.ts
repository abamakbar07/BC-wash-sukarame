import {
  AppError,
  NetworkError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  withRetry,
  logError,
} from "@/lib/error-utils"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface Booking {
  id: string
  booking_code: string
  customer_name: string
  customer_phone: string
  customer_email: string
  service_id: string
  branch_id: string
  booking_date: string // ISO date string
  booking_time: string // HH:MM format
  total_price: number
  status: "pending" | "confirmed" | "picked-up" | "in-progress" | "completed" | "cancelled"
  is_pickup_service: boolean
  pickup_address: string | null;
  pickup_notes: string | null;
  vehicle_plate_number: string
  payment_method: string
  payment_proof: string | null;
  loyalty_points_used: number
  loyalty_points_earned: number
  notes?: string
  booking_source: string
  created_by_admin: boolean
  created_at: string
  updated_at: string
  services: {
    name: string;
    price: number;
    category: string;
    duration: number;
    pickup_fee: number;
  };
  branches: {
    name: string;
    phone: string;
    address: string;
  };
}

interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  pickup_fee: number
  supports_pickup: boolean
  duration: number
  features: string[]
  is_active: boolean
  loyalty_points_reward?: number
  created_at: string
  updated_at: string
}

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  operating_hours_open: string
  operating_hours_close: string
  pickup_coverage_radius: number
  staff_count: number
  manager: string
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  status: "active" | "inactive" | "maintenance"
  latitude?: number | null
  longitude?: number | null
  created_at: string
  updated_at: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  vehicle_plate_numbers: string[]
  join_date: string
  total_bookings: number
  total_loyalty_points: number
  created_at: string
  updated_at: string
}

interface CreateBookingData {
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

class ApiClient {
  private baseUrl = "/api"

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Check network connectivity
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new NetworkError("No internet connection")
      }

      const response = await withRetry(
        async () => {
          const res = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
              "Content-Type": "application/json",
              ...options.headers,
            },
            ...options,
          })

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))

            switch (res.status) {
              case 400:
                throw new ValidationError(errorData.error || "Invalid request data")
              case 401:
                throw new UnauthorizedError(errorData.error || "Authentication required")
              case 403:
                throw new AppError(errorData.error || "Access forbidden", 403, "FORBIDDEN")
              case 404:
                throw new NotFoundError(errorData.error || "Resource not found")
              case 422:
                throw new ValidationError(errorData.error || "Validation failed")
              case 500:
                throw new AppError(errorData.error || "Internal server error", 500, "SERVER_ERROR")
              default:
                throw new AppError(errorData.error || `HTTP ${res.status}: ${res.statusText}`, res.status, "HTTP_ERROR")
            }
          }

          return res
        },
        3,
        1000,
      )

      const data = await response.json()
      return data
    } catch (error) {
      // Log error for debugging
      logError(error instanceof Error ? error : new Error(String(error)), {
        endpoint,
        options: { ...options, headers: options.headers },
      })

      // Re-throw for component handling
      throw error
    }
  }

  // Auth methods
  async login(username: string, password: string): Promise<{ success: boolean; admin: any }> {
    return this.request("/auth", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request("/auth", {
      method: "DELETE",
    })
  }

  async getBookings(params?: {
    branchId?: string
    status?: string
    date?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    page?: number
    search?: string
  }): Promise<{ bookings: Booking[]; total: number }> {
    try {
      const searchParams = new URLSearchParams()
      if (params?.branchId) searchParams.set("branchId", params.branchId)
      if (params?.status) searchParams.set("status", params.status)
      if (params?.date) searchParams.set("date", params.date)
      if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom)
      if (params?.dateTo) searchParams.set("dateTo", params.dateTo)
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      if (params?.page) searchParams.set("page", params.page.toString())
      if (params?.search) searchParams.set("search", params.search)

      const query = searchParams.toString()
      const result = await this.request<{ bookings: Booking[]; total: number }>(
        `/bookings${query ? `?${query}` : ""}`,
      )

      return result
    } catch (error) {
      console.error("[v0] Failed to fetch bookings:", error)
      throw error
    }
  }

  async getBooking(id: string): Promise<{ booking: Booking }> {
    try {
      return await this.request(`/bookings/${id}`)
    } catch (error) {
      console.error(`[v0] Failed to fetch booking with id ${id}:`, error)
      throw error
    }
  }

  async getBookingByCode(code: string): Promise<{ booking: Booking }> {
    try {
      return await this.request(`/bookings/by-code/${encodeURIComponent(code)}`)
    } catch (error) {
      console.error(`[v0] Failed to fetch booking with code ${code}:`, error)
      throw error
    }
  }

  async createBooking(bookingData: CreateBookingData): Promise<{ booking: Booking }> {
    try {
      return await this.request("/bookings", {
        method: "POST",
        body: JSON.stringify(bookingData),
      })
    } catch (error) {
      console.error("[v0] Failed to create booking:", error)
      throw error
    }
  }

  async updateBooking(id: string, updateData: Partial<Booking>): Promise<{ booking: Booking }> {
    try {
      return await this.request(`/bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      })
    } catch (error) {
      console.error(`[v0] Failed to update booking with id ${id}:`, error)
      throw error
    }
  }

  async deleteBooking(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request(`/bookings/${id}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error(`[v0] Failed to delete booking with id ${id}:`, error)
      throw error
    }
  }

  // New method to fetch booking statistics
  async getBookingStats(): Promise<ApiResponse<BookingStatsData>> {
    try {
      // The request method is private, so we call it internally.
      // The endpoint '/bookings/stats' is assumed to return BookingStatsData.
      return await this.request<ApiResponse<BookingStatsData>>("/bookings/stats");
    } catch (error) {
      console.error("[v0] Failed to fetch booking stats:", error);
      throw error;
    }
  }

  async getServices(): Promise<{ services: Service[] }> {
    try {
      return await this.request("/services")
    } catch (error) {
      console.error("[v0] Failed to fetch services:", error)
      throw error
    }
  }

  async createService(serviceData: Omit<Service, "id" | "created_at" | "updated_at">): Promise<{ service: Service }> {
    try {
      return await this.request("/services", {
        method: "POST",
        body: JSON.stringify(serviceData),
      })
    } catch (error) {
      console.error("[v0] Failed to create service:", error)
      throw error
    }
  }

  async updateService(id: string, serviceData: Partial<Service>): Promise<{ service: Service }> {
    try {
      return await this.request(`/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(serviceData),
      })
    } catch (error) {
      console.error(`[v0] Failed to update service with id ${id}:`, error)
      throw error
    }
  }

  async deleteService(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request(`/services/${id}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error(`[v0] Failed to delete service with id ${id}:`, error)
      throw error
    }
  }

  async getBranches(): Promise<{ branches: Branch[] }> {
    try {
      return await this.request("/branches")
    } catch (error) {
      console.error("[v0] Failed to fetch branches:", error)
      throw error
    }
  }

  async createBranch(branchData: Omit<Branch, "id" | "created_at" | "updated_at">): Promise<{ branch: Branch }> {
    try {
      return await this.request("/branches", {
        method: "POST",
        body: JSON.stringify(branchData),
      })
    } catch (error) {
      console.error("[v0] Failed to create branch:", error)
      throw error
    }
  }

  async updateBranch(id: string, branchData: Partial<Branch>): Promise<{ branch: Branch }> {
    try {
      return await this.request(`/branches/${id}`, {
        method: "PUT",
        body: JSON.stringify(branchData),
      })
    } catch (error) {
      console.error(`[v0] Failed to update branch with id ${id}:`, error)
      throw error
    }
  }

  async updateBranchStatus(id: string, status: "active" | "inactive"): Promise<{ branch: Branch }> {
    try {
      return await this.request(`/branches/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
    } catch (error) {
      console.error(`[v0] Failed to update branch status for id ${id}:`, error)
      throw error
    }
  }

  async getCustomers(params?: {
    vehiclePlateNumber?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ customers: Customer[]; total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.vehiclePlateNumber)
      searchParams.set("vehiclePlateNumber", params.vehiclePlateNumber)
    if (params?.search) searchParams.set("search", params.search)
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    const query = searchParams.toString()
    try {
      return await this.request(`/customers${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("[v0] Failed to fetch customers:", error)
      throw error
    }
  }

  async getCustomerDetail(id: string): Promise<{ customer: Customer }> {
    try {
      return await this.request(`/customers/${id}`)
    } catch (error) {
      console.error(`[v0] Failed to fetch customer detail with id ${id}:`, error)
      throw error
    }
  }

  async createCustomer(
    customerData: Omit<Customer, "id" | "created_at" | "updated_at">,
  ): Promise<{ customer: Customer }> {
    try {
      return await this.request("/customers", {
        method: "POST",
        body: JSON.stringify(customerData),
      })
    } catch (error) {
      console.error("[v0] Failed to create customer:", error)
      throw error
    }
  }

  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<{ customer: Customer }> {
    try {
      return await this.request(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(customerData),
      })
    } catch (error) {
      console.error(`[v0] Failed to update customer with id ${id}:`, error)
      throw error
    }
  }

  // Report methods
  async getReports(params?: {
    startDate?: string
    endDate?: string
    branchId?: string
  }): Promise<{ reports: any }> {
    const searchParams = new URLSearchParams()
    if (params?.startDate) searchParams.set("startDate", params.startDate)
    if (params?.endDate) searchParams.set("endDate", params.endDate)
    if (params?.branchId) searchParams.set("branchId", params.branchId)

    const query = searchParams.toString()
    try {
      return await this.request(`/reports${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("[v0] Failed to fetch reports:", error)
      throw error
    }
  }

  async uploadPaymentProof(bookingId: string, file: File): Promise<{ success: boolean; url?: string }> {
    try {
      // Import the storage function dynamically to avoid circular dependencies
      const { uploadPaymentProof, validatePaymentProofFile } = await import("@/lib/supabase/storage")

      // Validate file first
      const validation = validatePaymentProofFile(file)
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid file")
      }

      // Get booking to get booking code for filename
      const { booking } = await this.getBooking(bookingId)

      // Upload to storage
      const uploadResult = await uploadPaymentProof(file, booking.booking_code)

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || "Upload failed")
      }

      // Update booking with payment proof URL
      await this.updateBooking(bookingId, {
        payment_proof: uploadResult.url,
      })

      return {
        success: true,
        url: uploadResult.url,
      }
    } catch (error) {
      console.error("[v0] Failed to upload payment proof:", error)
      throw error
    }
  }
}

export const apiClient = new ApiClient()

export type { Booking, Service, Branch, Customer, CreateBookingData }
