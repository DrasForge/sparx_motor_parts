<?php
require_once 'api/config/database.php';
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT * FROM branches");
header('Content-Type: text/plain');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: " . $row['id'] . "\n";
    echo "NAME: " . $row['name'] . "\n";
    echo "ADDR: " . $row['address'] . "\n";
    echo "------------------\n";
}
?>
