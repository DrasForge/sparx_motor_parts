<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$branch_id = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : 1; 
$offset = ($page - 1) * $limit;

try {
    
    $countQuery = "SELECT COUNT(*) as total FROM products p";
    if (!empty($search)) {
        $countQuery .= " WHERE p.name LIKE :search OR p.sku LIKE :search";
    }
    
    $stmtCount = $db->prepare($countQuery);
    if (!empty($search)) {
        $searchTerm = "%{$search}%";
        $stmtCount->bindParam(':search', $searchTerm);
    }
    $stmtCount->execute();
    $total = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];
    
    
    $query = "SELECT p.*, i.quantity, i.reorder_point 
              FROM products p 
              LEFT JOIN inventory i ON p.id = i.product_id AND i.branch_id = :branch_id 
              WHERE 1=1";
              
    if (!empty($search)) {
        $query .= " AND (p.name LIKE :search OR p.sku LIKE :search)";
    }
    
    $query .= " LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':branch_id', $branch_id);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    
    if (!empty($search)) {
        $searchTerm = "%{$search}%";
        $stmt->bindParam(':search', $searchTerm);
    }
    
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(array(
        "data" => $products,
        "pagination" => array(
            "current_page" => $page,
            "total_items" => $total,
            "total_pages" => ceil($total / $limit),
            "limit" => $limit
        )
    ));

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
