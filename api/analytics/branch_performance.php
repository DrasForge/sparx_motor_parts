<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ReportService.php';

$database = new Database();
$db = $database->getConnection();
$reportService = new ReportService($db);

echo json_encode($reportService->getBranchPerformance());
?>
