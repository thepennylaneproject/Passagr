exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
    CREATE TABLE countries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        iso2 CHAR(2) UNIQUE,
        regions TEXT[] NOT NULL DEFAULT '{}',
        languages TEXT[] NOT NULL DEFAULT '{}',
        currency CHAR(3),
        timezones TEXT[] NOT NULL DEFAULT '{}',
        climate_tags TEXT[] NOT NULL DEFAULT '{}',
        healthcare_overview TEXT,
        rights_snapshot TEXT,
        tax_snapshot TEXT,
        last_verified_at TIMESTAMP WITH TIME ZONE,
        last_published_at TIMESTAMP WITH TIME ZONE,
        status TEXT NOT NULL DEFAULT 'draft',
        changelog_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE visa_paths (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        eligibility JSONB NOT NULL DEFAULT '[]',
        work_rights TEXT,
        dependents_rules TEXT,
        min_income_amount DECIMAL(10, 2),
        min_income_currency CHAR(3),
        min_savings_amount DECIMAL(10, 2),
        min_savings_currency CHAR(3),
        fees JSONB NOT NULL DEFAULT '[]',
        processing_min_days INT,
        processing_max_days INT,
        renewal_rules TEXT,
        to_pr_citizenship_timeline TEXT,
        last_verified_at TIMESTAMP WITH TIME ZONE,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (country_id, name)
    );

    CREATE TABLE requirements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visapath_id UUID NOT NULL REFERENCES visa_paths(id) ON DELETE CASCADE,
        label TEXT NOT NULL,
        details TEXT,
        doc_list TEXT[] NOT NULL DEFAULT '{}',
        notarization_needed BOOLEAN NOT NULL DEFAULT FALSE,
        apostille_needed BOOLEAN NOT NULL DEFAULT FALSE,
        last_verified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (visapath_id, label)
    );

    CREATE TABLE steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visapath_id UUID NOT NULL REFERENCES visa_paths(id) ON DELETE CASCADE,
        order_int INT NOT NULL,
        title TEXT NOT NULL,
        instructions TEXT,
        expected_duration_days INT,
        links JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (visapath_id, order_int)
    );

    CREATE TABLE sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL UNIQUE,
        title TEXT,
        publisher TEXT,
        content_type TEXT,
        excerpt TEXT,
        fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
        last_checked_at TIMESTAMP WITH TIME ZONE,
        reliability_score INT NOT NULL DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE cost_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope TEXT NOT NULL,
        country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
        visapath_id UUID REFERENCES visa_paths(id) ON DELETE SET NULL,
        label TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency CHAR(3) NOT NULL,
        frequency TEXT,
        source_id UUID NOT NULL REFERENCES sources(id),
        last_verified_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE cities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        tiers TEXT[] NOT NULL DEFAULT '{}',
        cost_of_living_index DECIMAL(5, 2),
        rent_index DECIMAL(5, 2),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (country_id, name)
    );

    CREATE TABLE changelogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type TEXT NOT NULL,
        entity_id UUID NOT NULL,
        change_type TEXT NOT NULL,
        diff_summary TEXT NOT NULL,
        diff_fields JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by TEXT NOT NULL,
        source_ids UUID[] NOT NULL DEFAULT '{}'
    );

    CREATE TABLE freshness_policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT NOT NULL UNIQUE,
        ttl_days INT NOT NULL,
        criticality TEXT NOT NULL
    );

    CREATE TABLE editorial_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type TEXT NOT NULL,
        entity_id UUID NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        reviewer_uid TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
    );

    CREATE INDEX idx_visa_path_country_id ON visa_paths(country_id);
    CREATE INDEX idx_requirements_visapath_id ON requirements(visapath_id);
    CREATE INDEX idx_steps_visapath_id ON steps(visapath_id);
    CREATE INDEX idx_cost_items_visapath_id ON cost_items(visapath_id);
    CREATE INDEX idx_cost_items_country_id ON cost_items(country_id);
    CREATE INDEX idx_sources_url ON sources(url);
    CREATE INDEX idx_cities_country_id ON cities(country_id);
    CREATE INDEX idx_changelogs_entity ON changelogs(entity_type, entity_id);
    CREATE INDEX idx_editorial_reviews_entity ON editorial_reviews(entity_type, entity_id);

    INSERT INTO freshness_policies (key, ttl_days, criticality) VALUES
    ('fees', 60, 'high'),
    ('processing_times', 60, 'high'),
    ('eligibility', 90, 'high'),
    ('steps', 120, 'medium'),
    ('tax_snapshot', 180, 'high'),
    ('rights_snapshot', 365, 'medium'),
    ('healthcare_overview', 365, 'medium');

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_visa_paths_updated_at BEFORE UPDATE ON visa_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_cost_items_updated_at BEFORE UPDATE ON cost_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = pgm => {
    // Irreversible for now or drop all
};
