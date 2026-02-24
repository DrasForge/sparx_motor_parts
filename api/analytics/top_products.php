<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ReportService.php';

$database = new Database();
$db = $database->getConnection();
$reportService = new ReportService($db);

$branch_id = $_GET['branch_id'] ?? null;
echo json_encode($reportService->getTopProducts($branch_id));
?>
