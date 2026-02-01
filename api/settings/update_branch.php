<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $query = "SELECT * FROM branches";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $branches = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($branches);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => $e->getMessage()));
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->id) && !empty($data->name) && !empty($data->address)) {
        try {
            $query = "UPDATE branches SET name = :name, address = :address WHERE id = :id";
            $stmt = $db->prepare($query);
            
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':address', $data->address);
            $stmt->bindParam(':id', $data->id);
            
            if ($stmt->execute()) {
                echo json_encode(array("message" => "Branch updated successfully."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to update branch."));
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(array("message" => $e->getMessage()));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Incomplete data."));
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->name) && !empty($data->address)) {
        try {
            $query = "INSERT INTO branches (name, address) VALUES (:name, :address)";
            $stmt = $db->prepare($query);
            
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':address', $data->address);
            
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(array("message" => "Branch created successfully."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "Unable to create branch."));
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(array("message" => $e->getMessage()));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Incomplete data."));
    }
} elseif ($method === 'DELETE') {
    
    $id = isset($_GET['id']) ? $_GET['id'] : die();

    try {
        
        
        $check = $db->prepare("SELECT COUNT(*) FROM inventory WHERE branch_id = :id AND quantity > 0");
        $check->bindParam(':id', $id);
        $check->execute();
        if ($check->fetchColumn() > 0) {
            http_response_code(409); 
            echo json_encode(array("message" => "Cannot delete branch with active inventory."));
            exit();
        }

        $query = "DELETE FROM branches WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            echo json_encode(array("message" => "Branch deleted successfully."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to delete branch."));
        }
    } catch (PDOException $e) {
         http_response_code(500);
         echo json_encode(array("message" => $e->getMessage()));
    }
}
?>
