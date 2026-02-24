<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/SalesService.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->branch_id) &&
    !empty($data->cashier_id) &&
    !empty($data->items) &&
    !empty($data->total)
) {
    try {
        $salesService = new SalesService($db);
        $result = $salesService->createSale($data);

        http_response_code(201);
        echo json_encode(array_merge(["message" => "Sale processed successfully."], $result));

    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode(["message" => "Transaction Failed: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
