CREATE TABLE employee_area_assignments (
    assignment_id BIGSERIAL   PRIMARY KEY,
    employee_id   BIGINT      NOT NULL REFERENCES employees(employee_id),
    area_id       BIGINT      NOT NULL REFERENCES areas(area_id),
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, area_id)
);

CREATE INDEX idx_eaa_employee_id ON employee_area_assignments(employee_id);
CREATE INDEX idx_eaa_area_id     ON employee_area_assignments(area_id);
