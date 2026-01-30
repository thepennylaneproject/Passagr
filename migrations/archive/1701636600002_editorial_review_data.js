exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
    -- Add proposed_data column to store the full proposed entity for comparison
    ALTER TABLE editorial_reviews 
    ADD COLUMN proposed_data JSONB;

    -- Add diff_summary column to store the diff output
    ALTER TABLE editorial_reviews 
    ADD COLUMN diff_summary TEXT;

    -- Add diff_fields column to store detailed field changes
    ALTER TABLE editorial_reviews 
    ADD COLUMN diff_fields JSONB;

    -- Add index on status for faster pending review queries
    CREATE INDEX IF NOT EXISTS idx_editorial_reviews_status ON editorial_reviews(status);
  `);
};

exports.down = pgm => {
    pgm.sql(`
    ALTER TABLE editorial_reviews 
    DROP COLUMN IF EXISTS proposed_data,
    DROP COLUMN IF EXISTS diff_summary,
    DROP COLUMN IF EXISTS diff_fields;

    DROP INDEX IF EXISTS idx_editorial_reviews_status;
  `);
};
