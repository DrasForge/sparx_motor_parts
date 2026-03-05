<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

include_once '../config/database.php';
include_once '../services/SalesService.php';

$database = new Database();
$db = $database->getConnection();
$salesService = new SalesService($db);

if (!isset($_GET['transaction_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Transaction ID is required."]);
    exit;
}

$transactionId = $_GET['transaction_id'];

try {
    $sale = $salesService->getSaleByTransactionId($transactionId);
    if ($sale) {
        http_response_code(200);
        echo json_encode($sale);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Sale not found."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Failed to fetch sale: " . $e->getMessage()]);
}
?>
