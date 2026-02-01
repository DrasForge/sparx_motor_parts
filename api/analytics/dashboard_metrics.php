<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$branch_id = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : null;

try {
    
    $salesQuery = "SELECT SUM(total) as total, COUNT(*) as count FROM sales WHERE DATE(created_at) = CURDATE()";
    if ($branch_id) $salesQuery .= " AND branch_id = :bid";
    
    $stmt = $db->prepare($salesQuery);
    if ($branch_id) $stmt->bindParam(':bid', $branch_id);
    $stmt->execute();
    $salesData = $stmt->fetch(PDO::FETCH_ASSOC);

    
    $stockQuery = "SELECT COUNT(*) as low_stock FROM inventory WHERE quantity <= 5"; 
    if ($branch_id) $stockQuery .= " AND branch_id = :bid";
    
    $stmt = $db->prepare($stockQuery);
    if ($branch_id) $stmt->bindParam(':bid', $branch_id);
    $stmt->execute();
    $stockData = $stmt->fetch(PDO::FETCH_ASSOC);

    
    $recentQuery = "SELECT id, customer_name, total as total_amount, created_at FROM sales";
    if ($branch_id) $recentQuery .= " WHERE branch_id = :bid";
    $recentQuery .= " ORDER BY created_at DESC LIMIT 5";
    
    $stmt = $db->prepare($recentQuery);
    if ($branch_id) $stmt->bindParam(':bid', $branch_id);
    $stmt->execute();
    $recentData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array(
        "sales_today" => $salesData['total'] ?? 0,
        "orders_today" => $salesData['count'] ?? 0,
        "low_stock" => $stockData['low_stock'] ?? 0,
        "recent_sales" => $recentData
    ));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
