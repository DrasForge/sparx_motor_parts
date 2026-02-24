<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/LogisticsService.php';

$database = new Database();
$db = $database->getConnection();
$logisticsService = new LogisticsService($db);

$branch_id = $_GET['branch_id'] ?? null;
echo json_encode($logisticsService->getTransfers($branch_id));
?>
