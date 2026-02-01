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
        
        $fields = [];
        $params = [':id' => $data->id];
        
        if(!empty($data->role)) {
            $fields[] = "role = :role";
            $params[':role'] = $data->role;
        }
        
        if(isset($data->branch_id)) { 
            $fields[] = "branch_id = :branch";
            $params[':branch'] = $data->branch_id;
        }
        
        if(!empty($data->password)) {
            $fields[] = "password_hash = :password";
            $params[':password'] = password_hash($data->password, PASSWORD_DEFAULT);
        }
        
        if(empty($fields)) {
            http_response_code(400);
            echo json_encode(array("message" => "No fields to update."));
            exit;
        }
        
        $query = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        
        if($stmt->execute($params)) {
             $adminId = isset($data->admin_id) ? $data->admin_id : null;
             if($adminId) {
                Logger::log($db, $adminId, 'User Updated', "Updated user ID: " . $data->id);
             }
             http_response_code(200);
             echo json_encode(array("message" => "User updated successfully."));
        } else {
             http_response_code(503);
             echo json_encode(array("message" => "Unable to update user."));
        }
        
    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode(array("message" => "Error: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Missing User ID."));
}
?>
