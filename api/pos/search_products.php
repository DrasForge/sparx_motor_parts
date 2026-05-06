<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$search = isset($_GET['search']) ? $_GET['search'] : '';
$branch_id = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$quick = isset($_GET['quick']) ? (int)$_GET['quick'] : 0;

try {
    
    $query = "SELECT p.sku, p.name, p.price, i.quantity 
              FROM products p 
              JOIN inventory i ON p.sku = i.product_sku 
              WHERE i.branch_id = :branch_id";

    if ($quick === 1) {
        $query .= " AND p.is_quick_access = 1";
    } else {
        $query .= " AND (p.sku LIKE :search OR p.name LIKE :search)";
    }
    
    $query .= " LIMIT :limit";

    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':branch_id', $branch_id);
    if ($quick === 0) {
        $searchTerm = "%{$search}%";
        $stmt->bindParam(':search', $searchTerm);
    }
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($products);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
