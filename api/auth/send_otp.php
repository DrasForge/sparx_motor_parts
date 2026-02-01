<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(isset($data->user_id)) {
    
    $code = rand(100000, 999999);
    $expires = date('Y-m-d H:i:s', strtotime('+5 minutes'));

    $query = "INSERT INTO otp_codes (user_id, code, expires_at) VALUES (:user_id, :code, :expires)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $data->user_id);
    $stmt->bindParam(":code", $code);
    $stmt->bindParam(":expires", $expires);

    if($stmt->execute()) {
        
        echo json_encode(array("message" => "OTP sent.", "code" => $code)); 
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to send OTP."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
