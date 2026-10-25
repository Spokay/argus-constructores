-- Fact-sheet fields of the brochure: OBJETO, CONTRATANTE, ÁREA (m²), VALOR (SMMLV), CIUDAD,
-- plus the sector and whether the project is still in execution. Existing rows are kept.
ALTER TABLE project RENAME COLUMN title TO name;
ALTER TABLE project RENAME COLUMN description TO purpose;

ALTER TABLE project ADD COLUMN client VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE project ALTER COLUMN client DROP DEFAULT;

ALTER TABLE project ADD COLUMN area_m2 NUMERIC(12, 2);
ALTER TABLE project ADD COLUMN value_smmlv NUMERIC(14, 3);

UPDATE project SET city = '' WHERE city IS NULL;
ALTER TABLE project ALTER COLUMN city SET NOT NULL;

ALTER TABLE project ADD COLUMN sector VARCHAR(20);
UPDATE project SET sector = CASE category WHEN 'RESIDENTIAL' THEN 'HOUSING' ELSE 'INSTITUTIONAL' END;
ALTER TABLE project ALTER COLUMN sector SET NOT NULL;

ALTER TABLE project ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE project ALTER COLUMN status DROP DEFAULT;

ALTER TABLE project DROP COLUMN category, DROP COLUMN completion_year;
