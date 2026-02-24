<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ReportService.php';

$database = new Database();
$db = $database->getConnection();
$reportService = new ReportService($db);

$days = $_GET['days'] ?? 7;
$branch_id = $_GET['branch_id'] ?? null;
echo json_encode($reportService->getSalesChart($days, $branch_id));
?>
