CREATE TABLE install_metadata (
    id                INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version    INTEGER NOT NULL,
    created_at        INTEGER NOT NULL,
    app_version       TEXT    NOT NULL
);

--> statement-breakpoint

INSERT INTO install_metadata (id, schema_version, created_at, app_version)
VALUES (1, 1, unixepoch() * 1000, '0.1.0');
