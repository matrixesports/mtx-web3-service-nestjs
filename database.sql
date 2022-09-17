-- Recipe Table
CREATE TABLE recipe (
    id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL CHECK (creator_id > 0),
    active BOOLEAN NOT NULL
    PRIMARY KEY (id)
);
CREATE INDEX ix_creator ON recipe USING btree(creator_id);

-- List  Indices
SELECT schemaname, indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;