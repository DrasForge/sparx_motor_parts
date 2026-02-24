<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/InventoryService.php';

$database = new Database();
$db = $database->getConnection();
$inventoryService = new InventoryService($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->sku) && !empty($data->name) && !empty($data->price)) {
    try {
        $product_id = $inventoryService->createProduct($data);
        http_response_code(201);
        echo json_encode(["message" => "Product created.", "id" => $product_id]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Failed to create product: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
