<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$product_id = isset($_GET['product_id']) ? (int)$_GET['product_id'] : null;

if ($product_id) {
    try {
        $query = "SELECT i.branch_id, b.name as branch_name, i.quantity 
                  FROM inventory i 
                  JOIN branches b ON i.branch_id = b.id 
                  WHERE i.product_id = :pid";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':pid', $product_id);
        $stmt->execute();
        $stock = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($stock);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => $e->getMessage()));
    }
} else {
    
    try {
        $query = "SELECT id, name FROM branches";
        $stmt = $db->prepare($query);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => $e->getMessage()));
    }
}
?>
