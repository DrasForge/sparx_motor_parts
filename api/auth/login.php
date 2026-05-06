<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/AuthService.php';
include_once '../services/AuditService.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$authService = new AuthService($db);
$auditService = new AuditService($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->username) && !empty($data->password)) {
    $user = $authService->login($data->username, $data->password);

    if($user) {
        $auditService->log($user['id'], 'LOGIN', 'User logged in successfully.');
        $token = $authService->generateToken($user);
        http_response_code(200);
        echo json_encode([
            "message" => "Login successful.",
            "user" => $user,
            "token" => $token
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid credentials."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
