exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
    ALTER TABLE countries
    ADD COLUMN lgbtq_rights_index INT NOT NULL DEFAULT 0,
    ADD COLUMN abortion_access_status TEXT,
    ADD COLUMN hate_crime_law_snapshot TEXT;

    ALTER TABLE visa_paths
    ADD COLUMN in_country_conversion_path TEXT;

    ALTER TABLE requirements
    ADD COLUMN prep_mode TEXT NOT NULL DEFAULT 'remote_only';

    INSERT INTO freshness_policies (key, ttl_days, criticality) VALUES
    ('lgbtq_rights_index', 90, 'high'),
    ('abortion_access_status', 30, 'critical'),
    ('hate_crime_law_snapshot', 180, 'medium')
    ON CONFLICT (key) DO UPDATE
    SET ttl_days = EXCLUDED.ttl_days, criticality = EXCLUDED.criticality;

    CREATE INDEX idx_countries_lgbtq_rights_index ON countries(lgbtq_rights_index);
    CREATE INDEX idx_countries_abortion_status ON countries(abortion_access_status);
    CREATE INDEX idx_requirements_prep_mode ON requirements(prep_mode);
  `);
};

exports.down = pgm => {
    // Irreversible for now
};
