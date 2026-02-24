<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ReportService.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$reportService = new ReportService($db);

try {
    echo json_encode($reportService->getAuditLogs());
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
