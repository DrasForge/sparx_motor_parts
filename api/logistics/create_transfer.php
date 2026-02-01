<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->product_id) &&
    !empty($data->source_branch_id) &&
    !empty($data->dest_branch_id) &&
    !empty($data->quantity) &&
    !empty($data->requested_by)
) {
    try {
        $query = "INSERT INTO transfers (product_id, source_branch_id, dest_branch_id, quantity, requested_by, status) 
                  VALUES (:pid, :src, :dest, :qty, :uid, 'pending')";
        
        $stmt = $db->prepare($query);

        $stmt->bindParam(":pid", $data->product_id);
        $stmt->bindParam(":src", $data->source_branch_id);
        $stmt->bindParam(":dest", $data->dest_branch_id);
        $stmt->bindParam(":qty", $data->quantity);
        $stmt->bindParam(":uid", $data->requested_by);

        if($stmt->execute()) {
            
            Logger::log($db, $data->requested_by, 'Transfer Requested', "Transfer from Branch " . $data->source_branch_id . " to " . $data->dest_branch_id);

            http_response_code(201);
            echo json_encode(array("message" => "Transfer request created successfully."));
        } else {
            throw new Exception("Unable to create transfer.");
        }
    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create transfer. " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
