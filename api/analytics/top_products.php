<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$branch_id = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : null;

try {
    $query = "SELECT p.name, p.sku, SUM(si.quantity) as sold_qty, SUM(si.subtotal) as revenue
              FROM sale_items si
              JOIN sales s ON si.sale_id = s.id
              JOIN products p ON si.product_id = p.id
              WHERE 1=1";
              
    if ($branch_id) $query .= " AND s.branch_id = :bid";
    
    $query .= " GROUP BY p.id ORDER BY sold_qty DESC LIMIT 10";

    $stmt = $db->prepare($query);
    if ($branch_id) $stmt->bindParam(':bid', $branch_id);
    $stmt->execute();
    $topProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($topProducts);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
