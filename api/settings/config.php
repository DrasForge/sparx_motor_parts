<?php
include_once '../config/cors.php';
include_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $query = "SELECT setting_key, setting_value FROM settings";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); 
        
        echo json_encode($settings);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => $e->getMessage()));
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    
    

    if (!empty($data->settings) && is_array($data->settings)) {
        try {
            $query = "UPDATE settings SET setting_value = :val WHERE setting_key = :key";
            $stmt = $db->prepare($query);

            foreach ($data->settings as $key => $value) {
                $stmt->bindParam(':val', $value);
                $stmt->bindParam(':key', $key);
                $stmt->execute();
            }

            echo json_encode(array("message" => "Settings updated successfully."));
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(array("message" => $e->getMessage()));
        }
    } else {
        http_response_code(400);
        echo json_encode(array("message" => "Invalid data."));
    }
}
?>
