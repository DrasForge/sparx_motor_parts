<?php
require_once 'api/config/database.php';
$db = (new Database())->getConnection();
$stmt = $db->query('DESCRIBE branches');
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . ' | ' . $row['Type'] . "\n";
}
?>
