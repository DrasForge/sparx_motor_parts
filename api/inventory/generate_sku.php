<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/InventoryService.php';

$database = new Database();
$db = $database->getConnection();
$inventoryService = new InventoryService($db);

$prefix = isset($_GET['prefix']) ? $_GET['prefix'] : 'SPX';
$sku = $inventoryService->generateRandomSku($prefix);

echo json_encode(["sku" => $sku]);
?>
