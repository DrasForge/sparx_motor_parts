<?php
$db = new PDO('mysql:host=localhost;dbname=gpos_db', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
try {
    $db->exec("ALTER TABLE sales MODIFY COLUMN status ENUM('completed', 'voided', 'refunded', 'partial_refund') DEFAULT 'completed'");
    echo "Success\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
