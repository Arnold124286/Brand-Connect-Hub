-- ============================================================
-- Brand Connect Hub (BCH) - PostgreSQL Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    uid          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type    VARCHAR(20) NOT NULL CHECK (user_type IN ('brand', 'vendor', 'admin')),
    email        VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    phone        VARCHAR(50),
    country      VARCHAR(100) DEFAULT 'Kenya',
    avatar_url   TEXT,
    is_verified  BOOLEAN DEFAULT FALSE,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brand_profiles (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid          UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    company_name VARCHAR(255),
    industry     VARCHAR(100),
    company_size VARCHAR(50),
    website      TEXT,
    description  TEXT,
    wallet_balance NUMERIC(12,2) DEFAULT 0.00,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_profiles (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid               UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    bio               TEXT,
    specializations   TEXT[],
    industries        TEXT[],
    hourly_rate       NUMERIC(10,2),
    years_experience  INT,
    verification_status VARCHAR(20) DEFAULT 'pending'
                        CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verification_docs TEXT[],
    avg_rating        NUMERIC(3,2) DEFAULT 0.00,
    total_reviews     INT DEFAULT 0,
    total_earnings    NUMERIC(12,2) DEFAULT 0.00,
    credits           NUMERIC(10,2) DEFAULT 10.00,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_listings (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id     UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    category      VARCHAR(100) NOT NULL,
    subcategory   VARCHAR(100),
    description   TEXT,
    price_from    NUMERIC(10,2),
    price_to      NUMERIC(10,2),
    delivery_days INT,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id   UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    category    VARCHAR(100),
    media_url   TEXT,
    project_url TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
    pid            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id       UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    category       VARCHAR(100) NOT NULL,
    subcategory    VARCHAR(100),
    budget_type    VARCHAR(20) CHECK (budget_type IN ('fixed', 'hourly')),
    budget_min     NUMERIC(10,2),
    budget_max     NUMERIC(10,2),
    deadline       DATE,
    industry       VARCHAR(100),
    skills_required TEXT[],
    status         VARCHAR(30) DEFAULT 'open'
                   CHECK (status IN ('open', 'in_review', 'in_progress', 'completed', 'cancelled', 'disputed')),
    assigned_vendor UUID REFERENCES vendor_profiles(id),
    is_flagged     BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE milestones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(pid) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    amount      NUMERIC(10,2),
    due_date    DATE,
    status      VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'paid')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bids (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id   UUID NOT NULL REFERENCES projects(pid) ON DELETE CASCADE,
    vendor_id    UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    proposal     TEXT NOT NULL,
    bid_amount   NUMERIC(10,2) NOT NULL,
    delivery_days INT NOT NULL,
    status       VARCHAR(20) DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, vendor_id)
);

CREATE TABLE transactions (
    tid            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id     UUID NOT NULL REFERENCES projects(pid),
    milestone_id   UUID REFERENCES milestones(id),
    brand_id       UUID NOT NULL REFERENCES users(uid),
    vendor_id      UUID NOT NULL REFERENCES vendor_profiles(id),
    amount         NUMERIC(12,2) NOT NULL,
    platform_fee   NUMERIC(12,2),
    net_amount     NUMERIC(12,2),
    status         VARCHAR(30) DEFAULT 'escrow_held'
                   CHECK (status IN ('escrow_held', 'released', 'refunded', 'disputed')),
    payment_method VARCHAR(50),
    payment_ref    VARCHAR(255),
    payment_date   TIMESTAMPTZ DEFAULT NOW(),
    release_date   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    mid         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID REFERENCES projects(pid) ON DELETE SET NULL,
    sender_id   UUID NOT NULL REFERENCES users(uid),
    receiver_id UUID NOT NULL REFERENCES users(uid),
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    attachment_url TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
    rid          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id   UUID NOT NULL REFERENCES projects(pid),
    reviewer_id  UUID NOT NULL REFERENCES users(uid),
    reviewee_id  UUID NOT NULL REFERENCES users(uid),
    rating       INT CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, reviewer_id)
);

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(255),
    message     TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    meta        JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE otp_codes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email      VARCHAR(255) NOT NULL,
    otp        VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_codes(email);

CREATE TABLE service_categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon        VARCHAR(50),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_projects_brand ON projects(brand_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_bids_project ON bids(project_id);
CREATE INDEX idx_messages_project ON messages(project_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO service_categories (name, slug, description, icon) VALUES
('Digital Marketing','digital-marketing','SEO, SEM, Social Media, Email Marketing','trending-up'),
('Graphic Design','graphic-design','Logos, Branding, Print, UI/UX Design','palette'),
('Content Creation','content-creation','Copywriting, Blogging, Video Scripts','edit'),
('Video & Animation','video-animation','Video Production, Motion Graphics, 3D','film'),
('Web Development','web-development','Frontend, Backend, Full-stack Development','code'),
('Photography','photography','Product, Event, Portrait Photography','camera'),
('Public Relations','public-relations','PR Strategy, Media Outreach, Brand Comms','megaphone'),
('Advertising','advertising','Media Buying, Campaign Strategy, OOH','radio');
