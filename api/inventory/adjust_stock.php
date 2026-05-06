<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/InventoryService.php';

$database = new Database();
$db = $database->getConnection();
$inventoryService = new InventoryService($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->sku) && !empty($data->branch_id) && !empty($data->adjustment_type) && isset($data->quantity)) {
    try {
        $inventoryService->adjustStock($data);
        echo json_encode(["message" => "Inventory adjusted successfully."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Failed to adjust inventory: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
