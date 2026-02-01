<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT u.id, u.username, u.role, u.branch_id, b.name as branch_name 
              FROM users u 
              LEFT JOIN branches b ON u.branch_id = b.id 
              ORDER BY u.id DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($users);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
