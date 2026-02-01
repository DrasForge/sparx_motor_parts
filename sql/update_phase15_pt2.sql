
ALTER TABLE sales ADD COLUMN shift_id INT NULL AFTER user_id;
ALTER TABLE sales ADD FOREIGN KEY (shift_id) REFERENCES shifts(id);
