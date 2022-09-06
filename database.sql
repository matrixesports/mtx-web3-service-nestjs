-- Invenotry Table
CREATE TABLE inventory (
    user_address VARCHAR NOT NULL CHECK (user_address ~* '^^0x[a-fA-F0-9]{40}$') ,
    contract_address VARCHAR NOT NULL  CHECK (contract_address ~* '^^0x[a-fA-F0-9]{40}$') ,
    id INTEGER NOT NULL CHECK (asset > 0),
    balance INTEGER NOT NULL CHECK (balance > 0),
    PRIMARY KEY (user_address, contract_address, id)
)