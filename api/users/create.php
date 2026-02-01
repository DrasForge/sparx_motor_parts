<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->username) &&
    !empty($data->password) &&
    !empty($data->role)
) {
    try {
        
        $checkQuery = "SELECT id FROM users WHERE username = :username";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':username', $data->username);
        $checkStmt->execute();
        
        if($checkStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(array("message" => "Username already exists."));
            exit;
        }

        $query = "INSERT INTO users (username, password_hash, role, branch_id) VALUES (:username, :password, :role, :branch)";
        $stmt = $db->prepare($query);

        $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
        $branch = !empty($data->branch_id) ? $data->branch_id : NULL;

        $stmt->bindParam(":username", $data->username);
        $stmt->bindParam(":password", $password_hash);
        $stmt->bindParam(":role", $data->role);
        $stmt->bindParam(":branch", $branch);

        if($stmt->execute()) {
            
            $adminId = isset($data->admin_id) ? $data->admin_id : null; 
            
            
            if($adminId) {
                Logger::log($db, $adminId, 'User Created', "Created user: " . $data->username);
            }

            http_response_code(201);
            echo json_encode(array("message" => "User created successfully."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to create user."));
        }
    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create user. " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
