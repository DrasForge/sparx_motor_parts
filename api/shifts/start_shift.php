<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ShiftService.php';

$database = new Database();
$db = $database->getConnection();
$shiftService = new ShiftService($db);

$data = json_decode(file_get_contents("php://input"));
if ($data && !empty($data->user_id)) {
    $id = $shiftService->startShift($data->user_id, $data->branch_id, $data->starting_cash);
    echo json_encode(["message" => "Shift started.", "shift_id" => $id]);
}
?>
