<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ShiftService.php';

$database = new Database();
$db = $database->getConnection();
$shiftService = new ShiftService($db);

$shift_id = $_GET['shift_id'] ?? null;
if ($shift_id) {
    $stats = $shiftService->getShiftStats($shift_id);
    echo json_encode($stats);
} else {
    http_response_code(400);
    echo json_encode(["message" => "Shift ID required."]);
}
?>
