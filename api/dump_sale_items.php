<?php
include_once 'config/database.php';
$db = (new Database())->getConnection();

$stmt = $db->query("DESCRIBE sale_items");
$schema = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $db->query("SELECT * FROM sale_items ORDER BY id DESC LIMIT 5");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "--- SCHEMA ---\n";
print_r($schema);
echo "\n--- DATA ---\n";
print_r($data);
?>
