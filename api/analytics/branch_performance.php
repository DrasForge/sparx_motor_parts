<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

try {
    
    $branchQuery = "SELECT id, name FROM branches";
    $stmt = $db->prepare($branchQuery);
    $stmt->execute();
    $branches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $results = [];

    foreach ($branches as $branch) {
        $bid = $branch['id'];

        
        $salesQuery = "SELECT SUM(total) as total_sales, COUNT(*) as transaction_count 
                       FROM sales 
                       WHERE branch_id = :bid AND DATE(created_at) = CURDATE()";
        $salesStmt = $db->prepare($salesQuery);
        $salesStmt->bindParam(':bid', $bid);
        $salesStmt->execute();
        $salesData = $salesStmt->fetch(PDO::FETCH_ASSOC);

        
        
        $itemsQuery = "SELECT SUM(si.quantity) as items_sold 
                       FROM sales_items si 
                       JOIN sales s ON si.sale_id = s.id 
                       WHERE s.branch_id = :bid AND DATE(s.created_at) = CURDATE()";
        $itemsStmt = $db->prepare($itemsQuery);
        $itemsStmt->bindParam(':bid', $bid);
        $itemsStmt->execute();
        $itemsData = $itemsStmt->fetch(PDO::FETCH_ASSOC);

        
        $stockQuery = "SELECT COUNT(*) as low_stock FROM inventory WHERE branch_id = :bid AND quantity <= 5";
        $stockStmt = $db->prepare($stockQuery);
        $stockStmt->bindParam(':bid', $bid);
        $stockStmt->execute();
        $stockData = $stockStmt->fetch(PDO::FETCH_ASSOC);

        $results[] = [
            'id' => $branch['id'],
            'name' => $branch['name'],
            'items_sold' => $itemsData['items_sold'] ?? 0,
            'transaction_count' => $salesData['transaction_count'] ?? 0,
            'total_sales' => $salesData['total_sales'] ?? 0,
            'low_stock' => $stockData['low_stock'] ?? 0
        ];
    }

    echo json_encode($results);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
