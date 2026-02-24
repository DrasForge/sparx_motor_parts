<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ReportService.php';

$database = new Database();
$db = $database->getConnection();
$reportService = new ReportService($db);

$branch_id = $_GET['branch_id'] ?? null;
$start_date = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
$end_date = $_GET['end_date'] ?? date('Y-m-d');

$start_date .= " 00:00:00";
$end_date .= " 23:59:59";

$transactions = $reportService->getTransactions($branch_id, $start_date, $end_date);

http_response_code(200);
echo json_encode($transactions ?: []);
?>
