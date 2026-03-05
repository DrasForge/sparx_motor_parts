<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

include_once '../config/database.php';
include_once '../services/SalesService.php';

$database = new Database();
$db = $database->getConnection();
$salesService = new SalesService($db);

$branch_id = isset($_GET['branch_id']) ? $_GET['branch_id'] : null;

if (!$branch_id) {
    http_response_code(400);
    echo json_encode(["message" => "Branch ID is required."]);
    exit;
}

try {
    $total = $salesService->getTotalRefundedToday($branch_id);
    http_response_code(200);
    echo json_encode(["total_refunded_today" => $total]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Failed to fetch total refunded: " . $e->getMessage()]);
}
?>
