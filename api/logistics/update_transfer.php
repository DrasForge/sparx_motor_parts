<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/LogisticsService.php';

$database = new Database();
$db = $database->getConnection();
$logisticsService = new LogisticsService($db);

$data = json_decode(file_get_contents("php://input"));
if ($data && !empty($data->id)) {
    try {
        $approvedBy = $data->approved_by ?? null;
        $logisticsService->updateTransfer($data->id, $data->status, $approvedBy);
        echo json_encode(["message" => "Transfer updated."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Update failed."]);
    }
}
?>
