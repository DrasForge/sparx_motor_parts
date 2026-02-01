<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$userId = isset($_GET['user_id']) ? $_GET['user_id'] : die();

try {
    $query = "SELECT * FROM shifts WHERE user_id = :uid AND status = 'open' ORDER BY start_time DESC LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':uid', $userId);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(array("status" => "open", "data" => $row));
    } else {
        echo json_encode(array("status" => "closed"));
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => $e->getMessage()));
}
?>
