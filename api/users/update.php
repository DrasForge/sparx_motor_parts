<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/UserService.php';

$database = new Database();
$db = $database->getConnection();
$userService = new UserService($db);

$data = json_decode(file_get_contents("php://input"));
if ($data && !empty($data->id)) {
    $userService->updateUser($data->id, $data);
    echo json_encode(["message" => "User updated."]);
}
?>
