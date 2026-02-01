<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->user_id) &&
    !empty($data->new_password) &&
    !empty($data->current_password)
) {
    try {
        
        $query = "SELECT password_hash FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->user_id);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if(password_verify($data->current_password, $row['password_hash'])) {
                
                $newHash = password_hash($data->new_password, PASSWORD_BCRYPT);
                $updateQuery = "UPDATE users SET password_hash = :hash WHERE id = :id";
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(':hash', $newHash);
                $updateStmt->bindParam(':id', $data->user_id);
                
                if($updateStmt->execute()) {
                    echo json_encode(array("message" => "Password updated successfully."));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "Unable to update password."));
                }
            } else {
                http_response_code(401);
                echo json_encode(array("message" => "Incorrect current password."));
            }
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "User not found."));
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
