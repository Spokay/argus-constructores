CREATE TABLE project
(
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT         NOT NULL,
    city            VARCHAR(100),
    completion_year INTEGER,
    category        VARCHAR(20)  NOT NULL,
    published       BOOLEAN      NOT NULL DEFAULT FALSE,
    position        INTEGER      NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL
);

CREATE TABLE project_image
(
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id   BIGINT      NOT NULL REFERENCES project (id) ON DELETE CASCADE,
    position     INTEGER     NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    data         BYTEA       NOT NULL
);

CREATE INDEX project_image_project_id_idx ON project_image (project_id);
