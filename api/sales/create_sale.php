<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));



if(
    !empty($data->branch_id) &&
    !empty($data->user_id) &&
    !empty($data->items) &&
    !empty($data->total_amount)
) {
    try {
        $db->beginTransaction();

        
        $shiftId = null;
        $shiftQuery = "SELECT id FROM shifts WHERE user_id = :uid AND status = 'open' LIMIT 1";
        $shiftStmt = $db->prepare($shiftQuery);
        $shiftStmt->bindParam(':uid', $data->user_id);
        $shiftStmt->execute();
        if ($shiftStmt->rowCount() > 0) {
            $shiftRow = $shiftStmt->fetch(PDO::FETCH_ASSOC);
            $shiftId = $shiftRow['id'];
        }

        
        $transactionId = date('YmdHis') . rand(100, 999);
        $saleQuery = "INSERT INTO sales (transaction_id, branch_id, cashier_id, shift_id, customer_name, total, payment_method, status, created_at) 
                      VALUES (:txn, :bid, :uid, :sid, :cust, :total, :method, 'completed', NOW())";
        
        $stmt = $db->prepare($saleQuery);
        $custName = !empty($data->customer_name) ? $data->customer_name : 'Walk-in';
        $payMethod = !empty($data->payment_method) ? $data->payment_method : 'cash';

        $stmt->bindParam(':txn', $transactionId);
        $stmt->bindParam(':bid', $data->branch_id);
        $stmt->bindParam(':uid', $data->user_id); 
        $stmt->bindParam(':sid', $shiftId); 
        $stmt->bindParam(':cust', $custName);
        $stmt->bindParam(':total', $data->total_amount);
        $stmt->bindParam(':method', $payMethod);
        $stmt->execute();
        
        $saleId = $db->lastInsertId();

        
        $itemQuery = "INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale, cost_price, subtotal) VALUES (:sid, :pid, :qty, :price, :cost, :sub)";
        $stockQuery = "UPDATE inventory SET quantity = quantity - :qty WHERE product_id = :pid AND branch_id = :bid AND quantity >= :qty";
        
        
        $costQuery = "SELECT cost_price FROM products WHERE id = :pid";
        $costStmt = $db->prepare($costQuery);

        $itemStmt = $db->prepare($itemQuery);
        $stockStmt = $db->prepare($stockQuery);

        foreach($data->items as $item) {
            
            $costStmt->bindParam(':pid', $item->product_id);
            $costStmt->execute();
            $costRow = $costStmt->fetch(PDO::FETCH_ASSOC);
            $costPrice = $costRow ? $costRow['cost_price'] : 0.00;
            $subtotal = $item->price * $item->quantity;

            
            $itemStmt->bindParam(':sid', $saleId);
            $itemStmt->bindParam(':pid', $item->product_id);
            $itemStmt->bindParam(':qty', $item->quantity);
            $itemStmt->bindParam(':price', $item->price);
            $itemStmt->bindParam(':cost', $costPrice); 
            $itemStmt->bindParam(':sub', $subtotal); 
            $itemStmt->execute();

            
            $stockStmt->bindParam(':qty', $item->quantity);
            $stockStmt->bindParam(':pid', $item->product_id);
            $stockStmt->bindParam(':bid', $data->branch_id);
            $stockStmt->execute();

            if($stockStmt->rowCount() == 0) {
                
                throw new Exception("Insufficient stock for Product ID: " . $item->product_id);
            }
        }

        $db->commit();
        
        
        Logger::log($db, $data->user_id, 'Sale Created', "Transaction ID: " . $transactionId . " | Total: " . $data->total_amount);

        http_response_code(201);
        echo json_encode(array("message" => "Sale processed successfully.", "sale_id" => $saleId, "transaction_id" => $transactionId));

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(array("message" => "Transaction Failed: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
