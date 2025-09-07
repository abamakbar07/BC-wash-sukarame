-- Add loyalty points reward column to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS loyalty_points_reward INTEGER NOT NULL DEFAULT 0;

-- Record each change in loyalty points
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  vehicle_plate_number TEXT NOT NULL,
  booking_id TEXT,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn','redeem','adjust')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
