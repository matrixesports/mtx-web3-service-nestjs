-- Recipe Table
CREATE TABLE recipe (
    id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL CHECK (creator_id > 0),
    PRIMARY KEY (id)
);
CREATE INDEX ix_creator ON recipe USING btree(creator_id);