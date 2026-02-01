<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->status) && !empty($data->approved_by)) {
    try {
        $db->beginTransaction();

        
        $getStmt = $db->prepare("SELECT * FROM transfers WHERE id = :id FOR UPDATE");
        $getStmt->bindParam(':id', $data->id);
        $getStmt->execute();
        $transfer = $getStmt->fetch(PDO::FETCH_ASSOC);

        if(!$transfer) {
            throw new Exception("Transfer not found.");
        }

        if($transfer['status'] !== 'pending') {
            throw new Exception("Transfer is already processed.");
        }

        
        $updateStmt = $db->prepare("UPDATE transfers SET status = :status, approved_by = :uid, updated_at = NOW() WHERE id = :id");
        $updateStmt->bindParam(':status', $data->status);
        $updateStmt->bindParam(':uid', $data->approved_by);
        $updateStmt->bindParam(':id', $data->id);
        $updateStmt->execute();

        
        if($data->status === 'approved') {
            
            $checkStock = $db->prepare("SELECT quantity FROM inventory WHERE product_id = :pid AND branch_id = :bid");
            $checkStock->bindParam(':pid', $transfer['product_id']);
            $checkStock->bindParam(':bid', $transfer['source_branch_id']);
            $checkStock->execute();
            $sourceQty = $checkStock->fetchColumn();

            if($sourceQty < $transfer['quantity']) {
                throw new Exception("Insufficient stock at source branch.");
            }

            
            $deduct = $db->prepare("UPDATE inventory SET quantity = quantity - :qty WHERE product_id = :pid AND branch_id = :bid");
            $deduct->bindParam(':qty', $transfer['quantity']);
            $deduct->bindParam(':pid', $transfer['product_id']);
            $deduct->bindParam(':bid', $transfer['source_branch_id']);
            $deduct->execute();

            
            
            $add = $db->prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (:pid, :bid, :qty) 
                                 ON DUPLICATE KEY UPDATE quantity = quantity + :qty");
            $add->bindParam(':qty', $transfer['quantity']);
            $add->bindParam(':pid', $transfer['product_id']);
            $add->bindParam(':bid', $transfer['dest_branch_id']);
            $add->execute();
        }

        $db->commit();
        
        
        Logger::log($db, $data->approved_by, 'Transfer Updated', "Transfer ID: " . $data->id . " Status: " . $data->status);

        echo json_encode(array("message" => "Transfer " . $data->status . " successfully."));

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(array("message" => "Operation failed: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
