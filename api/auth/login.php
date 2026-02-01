<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';





header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(isset($data->username) && isset($data->password)) {
    $query = "SELECT id, username, password_hash, role, branch_id FROM users WHERE username = :username LIMIT 0,1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $data->username);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if(password_verify($data->password, $row['password_hash'])) {
            
            $token = bin2hex(random_bytes(32));
            
            
            Logger::log($db, $row['id'], 'Login Success', 'User logged in via Web');

            http_response_code(200);
            echo json_encode(array(
                "message" => "Login successful.",
                "token" => $token, 
                "user" => array(
                    "id" => $row['id'],
                    "username" => $row['username'],
                    "role" => $row['role'],
                    "branch_id" => $row['branch_id']
                )
            ));
        } else {
            
            Logger::log($db, $row['id'], 'Login Failed', 'Invalid Password Attempt');
            
            http_response_code(401);
            echo json_encode(array("message" => "Invalid password."));
        }
    } else {
        
        
        
        
        
        
        
        
        
        
        http_response_code(401);
        echo json_encode(array("message" => "User not found."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
