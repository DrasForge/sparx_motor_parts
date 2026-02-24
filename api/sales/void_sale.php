<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/SalesService.php';
include_once '../services/AuditService.php';

$database = new Database();
$db = $database->getConnection();
$salesService = new SalesService($db);
$auditService = new AuditService($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->sale_id) && !empty($data->admin_id)) {
    try {
        $salesService->voidSale($data->sale_id, $data->admin_id);
        $auditService->logActivity($data->admin_id, 'Void Sale', "Voided Sale ID: " . $data->sale_id);
        echo json_encode(["message" => "Sale voided successfully."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
