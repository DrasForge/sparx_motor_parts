<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/InventoryService.php';

$database = new Database();
$db = $database->getConnection();
$inventoryService = new InventoryService($db);

$sku = isset($_GET['sku']) ? $_GET['sku'] : '';

if (!empty($sku)) {
    $exists = $inventoryService->checkSkuExists($sku);
    echo json_encode(["exists" => $exists]);
} else {
    http_response_code(400);
    echo json_encode(["message" => "SKU is required."]);
}
?>
