<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$branch_id = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : null;
$role = isset($_GET['role']) ? $_GET['role'] : '';


try {
    $query = "SELECT t.*, 
                p.name as product_name, p.sku,
                sb.name as source_branch_name,
                db_tbl.name as dest_branch_name,
                u.username as requested_by_name
              FROM transfers t
              JOIN products p ON t.product_id = p.id
              JOIN branches sb ON t.source_branch_id = sb.id
              JOIN branches db_tbl ON t.dest_branch_id = db_tbl.id
              JOIN users u ON t.requested_by = u.id
              WHERE 1=1";

    if ($role !== 'admin' && $branch_id) {
        $query .= " AND (t.source_branch_id = :branch_id OR t.dest_branch_id = :branch_id)";
    }
    
    $query .= " ORDER BY t.created_at DESC";

    $stmt = $db->prepare($query);

    if ($role !== 'admin' && $branch_id) {
        $stmt->bindParam(':branch_id', $branch_id);
    }

    $stmt->execute();
    $transfers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($transfers);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
