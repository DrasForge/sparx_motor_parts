<?php
include_once '../config/cors.php';
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT * FROM categories ORDER BY name ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($categories);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    if (!empty($data->name)) {
        try {
            $query = "INSERT INTO categories (name) VALUES (:name)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':name', $data->name);
            $stmt->execute();
            echo json_encode(["message" => "Category created.", "id" => $db->lastInsertId()]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to create category: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "Incomplete data."]);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        try {
            $query = "DELETE FROM categories WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            echo json_encode(["message" => "Category deleted."]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["message" => "Failed to delete category: " . $e->getMessage()]);
        }
    }
}
?>
