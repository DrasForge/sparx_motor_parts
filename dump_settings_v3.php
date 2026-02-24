<?php
require_once 'api/config/database.php';
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT * FROM settings");
header('Content-Type: text/plain');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['setting_key'] . " => " . $row['setting_value'] . "\n";
}
?>
