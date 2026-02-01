<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$branch_id = isset($_GET['branch_id']) ? $_GET['branch_id'] : '';
$start_date = isset($_GET['start_date']) ? $_GET['start_date'] : '';
$end_date = isset($_GET['end_date']) ? $_GET['end_date'] : '';

try {
    $query = "SELECT s.*, b.name as branch_name, u.username as cashier_name 
              FROM sales s 
              LEFT JOIN branches b ON s.branch_id = b.id 
              LEFT JOIN users u ON s.cashier_id = u.id 
              WHERE 1=1";

    if (!empty($branch_id)) {
        $query .= " AND s.branch_id = :branch_id";
    }

    if (!empty($start_date) && !empty($end_date)) {
        $query .= " AND DATE(s.created_at) BETWEEN :start_date AND :end_date";
    }

    $query .= " ORDER BY s.created_at DESC LIMIT 500"; // Limit for performance

    $stmt = $db->prepare($query);

    if (!empty($branch_id)) {
        $stmt->bindParam(':branch_id', $branch_id);
    }
    if (!empty($start_date) && !empty($end_date)) {
        $stmt->bindParam(':start_date', $start_date);
        $stmt->bindParam(':end_date', $end_date);
    }

    $stmt->execute();
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($transactions);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
