<?php
include_once 'api/config/database.php';
$database = new Database();
$db = $database->getConnection();
$res = $db->query("DESCRIBE products");
print_r($res->fetchAll(PDO::FETCH_ASSOC));
$res = $db->query("DESCRIBE inventory");
print_r($res->fetchAll(PDO::FETCH_ASSOC));
?>
