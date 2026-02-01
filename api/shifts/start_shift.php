<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->branch_id) && isset($data->starting_cash)) {
    try {
        
        $checkQuery = "SELECT id FROM shifts WHERE user_id = :uid AND status = 'open' LIMIT 1";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':uid', $data->user_id);
        $checkStmt->execute();

        if ($checkStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(array("message" => "You already have an open shift."));
            exit;
        }

        
        $query = "INSERT INTO shifts (user_id, branch_id, start_time, starting_cash, status) VALUES (:uid, :bid, NOW(), :sc, 'open')";
        $stmt = $db->prepare($query);

        $stmt->bindParam(':uid', $data->user_id);
        $stmt->bindParam(':bid', $data->branch_id);
        $stmt->bindParam(':sc', $data->starting_cash);

        if ($stmt->execute()) {
            $shiftId = $db->lastInsertId();
            Logger::log($db, $data->user_id, 'Shift Started', "Shift ID: $shiftId | Starting Cash: " . $data->starting_cash);
            http_response_code(201);
            echo json_encode(array("message" => "Shift started successfully.", "shift_id" => $shiftId));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to start shift."));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
