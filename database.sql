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


-- Invenotry Table
CREATE TABLE inventory (
    user_address VARCHAR NOT NULL CHECK (user_address ~* '^^0x[a-fA-F0-9]{40}$'),
    creator_id INTEGER NOT NULL CHECK (creator_id > 0),
    asset INTEGER NOT NULL CHECK (asset > 0),
    balance INTEGER NOT NULL CHECK (balance > 0),
    PRIMARY KEY (user_address, creator_id, asset)
);

