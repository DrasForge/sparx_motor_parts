<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ShiftService.php';

$database = new Database();
$db = $database->getConnection();
$shiftService = new ShiftService($db);

$data = json_decode(file_get_contents("php://input"));
if ($data && !empty($data->shift_id)) {
    $result = $shiftService->endShift($data->shift_id, $data->ending_cash);
    echo json_encode(["message" => "Shift closed.", "data" => $result]);
}
?>
