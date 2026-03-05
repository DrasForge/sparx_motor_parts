<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../config/database.php';
include_once '../services/SalesService.php';
include_once '../services/AuditService.php';

$database = new Database();
$db = $database->getConnection();
$salesService = new SalesService($db);
$auditService = new AuditService($db);

$data = json_decode(file_get_contents("php://input"));

if (
    empty($data->sale_id) ||
    empty($data->cashier_id) ||
    !isset($data->total_refund) ||
    empty($data->items)
) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete return data."]);
    exit;
}

try {
    $result = $salesService->processReturn($data);

    // Get transaction ID for logging
    $stmt = $db->prepare("SELECT transaction_id FROM sales WHERE id = ?");
    $stmt->execute([$data->sale_id]);
    $tId = $stmt->fetchColumn();

    $auditService->logActivity(
        $data->cashier_id, 
        'Sale Refunded', 
        "Transaction ID: $tId | Total Refund: {$data->total_refund}"
    );

    http_response_code(201);
    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Failed to process return: " . $e->getMessage()]);
}
?>
