<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ShiftService.php';

$database = new Database();
$db = $database->getConnection();
$shiftService = new ShiftService($db);

$user_id = $_GET['user_id'];
$shift = $shiftService->checkStatus($user_id);

if ($shift) {
    echo json_encode(["status" => "open", "data" => $shift]);
} else {
    echo json_encode(["status" => "closed"]);
}
?>
