<?php
include_once '../config/cors.php';
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if ($data && !empty($data->user_id)) {
    $query = "SELECT * FROM users WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->user_id);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($data->current_password, $user['password_hash'])) {
        $updateQuery = "UPDATE users SET password_hash = :pass WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $hashed = password_hash($data->new_password, PASSWORD_DEFAULT);
        $updateStmt->bindParam(':pass', $hashed);
        $updateStmt->bindParam(':id', $data->user_id);
        if ($updateStmt->execute()) {
            echo json_encode(["message" => "Profile updated."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Update failed."]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Incorrect password."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
