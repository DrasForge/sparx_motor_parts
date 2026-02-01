<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(isset($data->user_id) && isset($data->code)) {
    $course_query = "SELECT * FROM otp_codes WHERE user_id = :user_id AND code = :code AND expires_at > :now ORDER BY created_at DESC LIMIT 1";
    $stmt = $db->prepare($course_query);
    $stmt->bindParam(":user_id", $data->user_id);
    $stmt->bindParam(":code", $data->code);
    $now = date('Y-m-d H:i:s');
    $stmt->bindParam(":now", $now);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        
        
        $del = "DELETE FROM otp_codes WHERE user_id = :user_id";
        $delStmt = $db->prepare($del);
        $delStmt->bindParam(":user_id", $data->user_id);
        $delStmt->execute();

        echo json_encode(array("message" => "OTP Verified.", "verified" => true));
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Invalid or expired OTP.", "verified" => false));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
