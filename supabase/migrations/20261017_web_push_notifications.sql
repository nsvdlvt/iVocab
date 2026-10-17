-- ==============================================================================
-- VOCABEE: Web Push Notifications Schema & RLS Policies
-- ==============================================================================

-- 1. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_successful_delivery_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    failure_count INTEGER NOT NULL DEFAULT 0
);

-- Indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Admins can view and manage all subscriptions" ON push_subscriptions;

-- User policy: users can select, insert, update, delete only their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions"
    ON push_subscriptions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin policy: admins can view and manage subscriptions for push dispatch
CREATE POLICY "Admins can view and manage all subscriptions"
    ON push_subscriptions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 2. Extend admin_announcements with push delivery tracking fields
ALTER TABLE admin_announcements 
    ADD COLUMN IF NOT EXISTS delivery_channels TEXT NOT NULL DEFAULT 'in_app',
    ADD COLUMN IF NOT EXISTS push_attempt_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS push_success_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS push_failure_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS push_delivered_at TIMESTAMPTZ;

-- 3. Create announcement_push_deliveries for idempotency and audit trail
CREATE TABLE IF NOT EXISTS announcement_push_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES admin_announcements(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'failed', 'expired'
    status_code INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_announcement_sub UNIQUE (announcement_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_push_ann_id ON announcement_push_deliveries(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_push_user_id ON announcement_push_deliveries(user_id);

ALTER TABLE announcement_push_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push delivery logs" ON announcement_push_deliveries;
DROP POLICY IF EXISTS "Admins can manage all push delivery logs" ON announcement_push_deliveries;

CREATE POLICY "Users can view own push delivery logs"
    ON announcement_push_deliveries
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all push delivery logs"
    ON announcement_push_deliveries
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
