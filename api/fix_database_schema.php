<?php
require_once 'config/database.php';
$db = (new Database())->getConnection();

function execSql($db, $sql, $msg) {
    try {
        $db->exec($sql);
        echo "[OK] $msg\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false || strpos($e->getMessage(), 'exists') !== false) {
             echo "[SKIP] $msg (Exists)\n";
        } else {
             echo "[ERR] $msg: " . $e->getMessage() . "\n";
        }
    }
}

echo "--- Fixing Schema ---\n";


execSql($db, "CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    branch_id INT NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME NULL,
    starting_cash DECIMAL(10,2) DEFAULT 0.00,
    ending_cash DECIMAL(10,2) DEFAULT 0.00,
    total_sales DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('open', 'closed') DEFAULT 'open'
)", "Create shifts table");


execSql($db, "ALTER TABLE sales ADD COLUMN shift_id INT NULL", "Add shift_id to sales");
execSql($db, "ALTER TABLE sales ADD FOREIGN KEY (shift_id) REFERENCES shifts(id)", "Add FK sales(shift_id)");


execSql($db, "ALTER TABLE sale_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00", "Add cost_price to sale_items");
execSql($db, "ALTER TABLE sale_items ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0.00", "Add subtotal to sale_items");
execSql($db, "ALTER TABLE sale_items ADD COLUMN price_at_sale DECIMAL(10,2) DEFAULT 0.00", "Add price_at_sale to sale_items");


execSql($db, "ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00", "Add cost_price to products");


try {
    $cols = $db->query("DESCRIBE sale_items")->fetchAll(PDO::FETCH_COLUMN);
    if(in_array('price', $cols) && in_array('price_at_sale', $cols)) {
        execSql($db, "UPDATE sale_items SET price_at_sale = price WHERE price_at_sale IS NULL OR price_at_sale = 0", "Migrate price -> price_at_sale");
    }
} catch (Exception $e) {
    echo "[WARN] Migration check failed: " . $e->getMessage() . "\n";
}

echo "--- Verification ---\n";
try {
    $salesCols = $db->query("DESCRIBE sales")->fetchAll(PDO::FETCH_COLUMN);
    echo "Sales columns: " . implode(', ', $salesCols) . "\n";
} catch(Exception $e) { echo $e->getMessage() . "\n"; }
?>
