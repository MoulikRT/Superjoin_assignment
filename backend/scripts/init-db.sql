---Drop table if exists
DROP TABLE IF EXISTS users;

CREATE TABLE users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    row_number INT NOT NULL,
    column_name VARCHAR(50) NOT NULL,
    value VARCHAR(255),
    cell_value TEXT,
    last_modified_by VARCHAR(50) DEFAULT 'user',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cell (row_number, column_name)
);

CREATE INDEX idx_row_column ON users (row_number, column_name);
CREATE INDEX idx_modified_by ON users (last_modified_by);

INSERT INTO users (row_number, column_name, value, cell_value, last_modified_by) VALUES
(1, 'A', 'Name', 'Name', 'system'),
(1, 'B', 'Age', 'Age', 'system'),
(1, 'C', 'City', 'City', 'system'),
(2, 'A', 'John Doe', 'John Doe', 'user'),
(2, 'B', '30', '30', 'user'),
(2, 'C', 'New York', 'New York', 'user'),
(3, 'A', 'Jane Smith', 'Jane Smith', 'user'),
(3, 'B', '25', '25', 'user'),
(3, 'C', 'London', 'London', 'user');