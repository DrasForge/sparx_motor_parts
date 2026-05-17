<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ShiftService.php';

$database = new Database();
$db = $database->getConnection();
$shiftService = new ShiftService($db);

$status = $_GET['status'] ?? null;
$branch_id = $_GET['branch_id'] ?? null;
$start_date = $_GET['start_date'] ?? null;
$end_date = $_GET['end_date'] ?? null;

if ($start_date && $end_date) {
    $start_date .= " 00:00:00";
    $end_date .= " 23:59:59";
}

$shifts = $shiftService->getShifts($status, $branch_id, $start_date, $end_date);

http_response_code(200);
echo json_encode($shifts ?: []);
?>
