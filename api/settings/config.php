<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ConfigService.php';

$database = new Database();
$db = $database->getConnection();
$configService = new ConfigService($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode($configService->getSettings());
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if ($data && isset($data->settings)) {
        $configService->updateSettings((array)$data->settings);
        http_response_code(200);
        echo json_encode(["message" => "Settings updated."]);
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Invalid data."]);
    }
}
?>
