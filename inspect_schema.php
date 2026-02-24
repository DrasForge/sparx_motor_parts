<?php
require_once 'api/config/database.php';
$db = (new Database())->getConnection();

function describeTable($db, $table) {
    echo "--- Table: $table ---\n";
    try {
        $stmt = $db->query("DESCRIBE $table");
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "{$row['Field']} | {$row['Type']} | {$row['Null']} | {$row['Key']} | {$row['Default']} | {$row['Extra']}\n";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

describeTable($db, 'sales');
describeTable($db, 'sale_items');
describeTable($db, 'products');
describeTable($db, 'inventory');
?>
