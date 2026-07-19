-- Ongoing Projects, Programs (national/state), Weekly Activities,
-- unified Contributions (giving), and Satellite Churches.

-- Ongoing projects the admin uploads; members give toward them.
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    target_amount DECIMAL(15, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_project_status CHECK (status IN ('active', 'completed', 'archived'))
);

-- National / State programs (replaces the old "Events" concept for members).
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scope VARCHAR(20) NOT NULL DEFAULT 'national',
    image_url VARCHAR(500),
    location VARCHAR(255),
    start_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_program_scope CHECK (scope IN ('national', 'state')),
    CONSTRAINT chk_program_status CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled'))
);

-- Recurring weekly activities shown in the members' activities section.
CREATE TABLE IF NOT EXISTS weekly_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_activity_day CHECK (
        day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    )
);

-- Unified giving records toward a project or a program.
-- Manual payment flow: a member records a pending contribution ("I've paid"),
-- an admin later confirms it. is_anonymous only hides the giver from public
-- lists; the giver is always retained for admin follow-up.
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL,
    source_id UUID NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    note TEXT,
    confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_contribution_source CHECK (source_type IN ('project', 'program')),
    CONSTRAINT chk_contribution_status CHECK (status IN ('pending', 'confirmed', 'rejected')),
    CONSTRAINT chk_contribution_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_contributions_source ON contributions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);

-- Satellite churches created by the super-admin and assigned to a member.
CREATE TABLE IF NOT EXISTS satellite_churches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_satellite_assigned ON satellite_churches(assigned_user_id);

-- Keep updated_at fresh (reuses the function defined in schema.sql).
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_activities_updated_at BEFORE UPDATE ON weekly_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_satellite_churches_updated_at BEFORE UPDATE ON satellite_churches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
