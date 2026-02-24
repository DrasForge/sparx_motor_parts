<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/LogisticsService.php';

$database = new Database();
$db = $database->getConnection();
$logisticsService = new LogisticsService($db);

$data = json_decode(file_get_contents("php://input"));
if ($data && !empty($data->from_branch_id)) {
    $id = $logisticsService->createTransfer($data);
    echo json_encode(["message" => "Transfer created.", "id" => $id]);
}
?>
