<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/ConfigService.php';

$database = new Database();
$db = $database->getConnection();
$configService = new ConfigService($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode($configService->getBranches());
} elseif ($method === 'POST' || $method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    $configService->updateBranch($data);
    echo json_encode(["message" => "Branch updated."]);
} elseif ($method === 'DELETE') {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "Branch ID required."]);
            exit;
        }
        $configService->deleteBranch($id);
        echo json_encode(["message" => "Branch deleted."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["message" => "Failed to delete branch: " . $e->getMessage()]);
    }
}
?>
