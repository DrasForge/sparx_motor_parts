<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    try {
        
        

        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);

        if($stmt->execute()) {
            $adminId = isset($data->admin_id) ? $data->admin_id : null;
            if($adminId) {
                Logger::log($db, $adminId, 'User Deleted', "Deleted user ID: " . $data->id);
            }
            http_response_code(200);
            echo json_encode(array("message" => "User deleted successfully."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to delete user."));
        }
    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. code:400"));
}
?>
