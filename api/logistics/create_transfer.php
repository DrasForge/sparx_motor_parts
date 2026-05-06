<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/LogisticsService.php';

$database = new Database();
$db = $database->getConnection();
$logisticsService = new LogisticsService($db);

$data = json_decode(file_get_contents("php://input"));
if ($data && !empty($data->product_sku) && !empty($data->source_branch_id)) {
    try {
        $id = $logisticsService->createTransfer($data);
        echo json_encode(["message" => "Transfer request submitted.", "id" => $id]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Failed to create transfer: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
