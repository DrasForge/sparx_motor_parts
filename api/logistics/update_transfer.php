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
        $code = $e->getMessage() === "Only admin users can approve or reject transfer requests." ? 403 : 500;
        http_response_code($code);
        echo json_encode(["message" => $e->getMessage()]);
    }
}
?>
