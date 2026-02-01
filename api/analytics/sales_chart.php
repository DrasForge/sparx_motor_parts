<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$branch_id = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : null;
$days = isset($_GET['days']) ? (int)$_GET['days'] : 7;

try {
    
    $query = "SELECT DATE(created_at) as date, SUM(total_amount) as total 
              FROM sales 
              WHERE created_at >= DATE(NOW()) - INTERVAL :days DAY";
    
    if ($branch_id) $query .= " AND branch_id = :bid";
    
    $query .= " GROUP BY DATE(created_at) ORDER BY date ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':days', $days, PDO::PARAM_INT);
    if ($branch_id) $stmt->bindParam(':bid', $branch_id);
    $stmt->execute();
    $chartData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($chartData);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
