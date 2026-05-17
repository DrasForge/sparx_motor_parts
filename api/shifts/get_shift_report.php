<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ShiftService.php';

$database = new Database();
$db = $database->getConnection();
$shiftService = new ShiftService($db);

$shift_id = $_GET['shift_id'] ?? null;

if (!$shift_id) {
    http_response_code(400);
    echo json_encode(["message" => "Shift ID required."]);
    exit;
}

$report = $shiftService->getShiftReport($shift_id);

if (!$report) {
    http_response_code(404);
    echo json_encode(["message" => "Shift not found."]);
    exit;
}

http_response_code(200);
echo json_encode($report);
?>
