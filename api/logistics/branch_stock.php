<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/LogisticsService.php';

$database = new Database();
$db = $database->getConnection();
$logisticsService = new LogisticsService($db);

$branch_id = $_GET['branch_id'] ?? null;
$product_sku = $_GET['product_sku'] ?? null;

if ($branch_id) {
    echo json_encode($logisticsService->getBranchStock($branch_id));
} elseif ($product_sku) {
    echo json_encode($logisticsService->getProductStock($product_sku));
} else {
    echo json_encode($logisticsService->getBranchStock(1)); // Default
}
?>
