<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/AuthService.php';

$database = new Database();
$db = $database->getConnection();
$authService = new AuthService($db);

$data = json_decode(file_get_contents("php://input"));

if ($data && !empty($data->username) && !empty($data->otp)) {
    $user = $authService->verifyOTP($data->username, $data->otp);
    if ($user) {
        $token = $authService->generateToken($user);
        unset($user['password_hash']);
        echo json_encode([
            "message" => "OTP verified.",
            "user" => $user,
            "token" => $token
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid or expired OTP."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
