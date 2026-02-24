<?php
include_once 'config/cors.php';
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $db->exec("ALTER TABLE sales ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(50) AFTER id");
    $db->exec("ALTER TABLE sales ADD COLUMN IF NOT EXISTS shift_id INT AFTER branch_id");
    $db->exec("ALTER TABLE sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2)");
    $db->exec("ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2)");
    $db->exec("ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2)");
    
    $db->exec("CREATE TABLE IF NOT EXISTS shifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        branch_id INT,
        starting_cash DECIMAL(10,2),
        ending_cash DECIMAL(10,2),
        status ENUM('open', 'closed'),
        start_time DATETIME,
        end_time DATETIME
    )");
    
    echo json_encode(["message" => "Schema verified."]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
