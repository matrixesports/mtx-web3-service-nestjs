-- Recipe Table
CREATE TABLE recipe (
    recipe_id INTEGER NOT NULL,
    creator_id INTEGER NOT NULL CHECK (creator_id > 0),
    PRIMARY KEY (recipe_id)
);
CREATE INDEX ix_creator ON recipe USING btree(creator_id);