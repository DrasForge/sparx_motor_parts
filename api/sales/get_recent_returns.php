<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$branch_id = $_GET['branch_id'] ?? null;

if (!$branch_id) {
    http_response_code(400);
    echo json_encode(["message" => "Branch ID is required."]);
    exit;
}

try {
    $query = "SELECT r.*, s.transaction_id, u.username as cashier_name
              FROM returns r
              JOIN sales s ON r.sale_id = s.id
              JOIN users u ON r.cashier_id = u.id
              WHERE s.branch_id = :bid AND DATE(r.created_at) = CURDATE()
              ORDER BY r.id DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':bid', $branch_id);
    $stmt->execute();
    
    $returns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    http_response_code(200);
    echo json_encode($returns);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Failed to fetch returns: " . $e->getMessage()]);
}
?>
