<?php
require_once 'config/database.php';
$db = (new Database())->getConnection();

function execSql($db, $sql, $msg) {
    try {
        $db->exec($sql);
        echo "[OK] $msg\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'exists') !== false) {
             echo "[SKIP] $msg (Exists)\n";
        } else {
             echo "[ERR] $msg: " . $e->getMessage() . "\n";
        }
    }
}

echo "--- Creating Missing Tables ---\n";



$sql = "CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    price_at_sale DECIMAL(10,2) DEFAULT 0.00,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
)";

execSql($db, $sql, "Create sale_items table");


try {
    $cols = $db->query("DESCRIBE sale_items")->fetchAll(PDO::FETCH_COLUMN);
    echo "sale_items columns: " . implode(', ', $cols) . "\n";
} catch(Exception $e) { echo $e->getMessage() . "\n"; }

?>
