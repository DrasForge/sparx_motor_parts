<?php
require_once 'api/config/database.php';
$db = (new Database())->getConnection();

echo "--- Table: settings ---\n";
$stmt = $db->query("SELECT * FROM settings");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "KEY: " . $row['setting_key'] . " | VAL: " . $row['setting_value'] . "\n";
}

echo "\n--- Table: branches ---\n";
try {
    $stmt = $db->query("SELECT * FROM branches");
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "BRANCH ID: " . $row['id'] . " | NAME: " . $row['name'] . " | ADDR: " . $row['address'] . "\n";
    }
} catch (Exception $e) {
    echo "Branches table not found.\n";
}
?>
