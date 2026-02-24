<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/UserService.php';

$database = new Database();
$db = $database->getConnection();
$userService = new UserService($db);

$id = $_GET['id'] ?? null;
if ($id) {
    $userService->deleteUser($id);
    echo json_encode(["message" => "User deleted."]);
}
?>
