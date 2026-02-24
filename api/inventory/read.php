<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/InventoryService.php';

$database = new Database();
$db = $database->getConnection();
$inventoryService = new InventoryService($db);

$branch_id = isset($_GET['branch_id']) ? $_GET['branch_id'] : null;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
$search = isset($_GET['search']) ? $_GET['search'] : '';

$response = $inventoryService->getAllProducts($branch_id, $page, $limit, $search);

if ($response['data']) {
    http_response_code(200);
    echo json_encode($response);
} else {
    http_response_code(404);
    echo json_encode(["message" => "No products found.", "data" => [], "pagination" => ["current_page" => $page, "total_pages" => 0, "total_items" => 0]]);
}
?>
