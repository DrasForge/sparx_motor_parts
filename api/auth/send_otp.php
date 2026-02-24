<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/AuthService.php';

$database = new Database();
$db = $database->getConnection();
$authService = new AuthService($db);

$data = json_decode(file_get_contents("php://input"));

if ($data && !empty($data->username)) {
    $otp = $authService->generateOTP($data->username);
    echo json_encode(["message" => "OTP sent.", "otp" => $otp]);
} else {
    http_response_code(400);
    echo json_encode(["message" => "Username required."]);
}
?>
