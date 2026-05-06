<?php
include_once 'api/config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $db->exec("ALTER TABLE sales ADD COLUMN customer_name VARCHAR(255) DEFAULT 'Walk-in Customer' AFTER transaction_id");
    echo "Column customer_name added successfully to sales table.\n";
} catch (Exception $e) {
    echo "Error or column already exists: " . $e->getMessage() . "\n";
}

try {
    $db->exec("UPDATE sales SET customer_name = 'Walk-in Customer' WHERE customer_name IS NULL");
    echo "Existing records updated.\n";
} catch (Exception $e) {
    echo "Update error: " . $e->getMessage() . "\n";
}
?>
