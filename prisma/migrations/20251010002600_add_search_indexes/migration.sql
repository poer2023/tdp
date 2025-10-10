-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index for Post full-text search
-- Using 'simple' config for better Chinese support
CREATE INDEX IF NOT EXISTS "idx_post_search_fts" ON "Post"
USING GIN (
  to_tsvector('simple',
    COALESCE(title, '') || ' ' ||
    COALESCE(excerpt, '') || ' ' ||
    COALESCE(content, '') || ' ' ||
    COALESCE(tags, '')
  )
);

-- Add trigram index for Post fuzzy matching
CREATE INDEX IF NOT EXISTS "idx_post_title_trgm" ON "Post"
USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_post_content_trgm" ON "Post"
USING GIN (content gin_trgm_ops);

-- Add GIN index for GalleryImage full-text search
CREATE INDEX IF NOT EXISTS "idx_gallery_search_fts" ON "GalleryImage"
USING GIN (
  to_tsvector('simple',
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE("locationName", '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(country, '')
  )
);

-- Add trigram index for GalleryImage fuzzy matching
CREATE INDEX IF NOT EXISTS "idx_gallery_title_trgm" ON "GalleryImage"
USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_gallery_location_trgm" ON "GalleryImage"
USING GIN ("locationName" gin_trgm_ops);

-- Add GIN index for Moment full-text search
CREATE INDEX IF NOT EXISTS "idx_moment_search_fts" ON "Moment"
USING GIN (
  to_tsvector('simple',
    COALESCE(content, '')
  )
);

-- Add trigram index for Moment fuzzy matching
CREATE INDEX IF NOT EXISTS "idx_moment_content_trgm" ON "Moment"
USING GIN (content gin_trgm_ops);
