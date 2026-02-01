<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->sale_id) && !empty($data->admin_id)) {
    try {
        $db->beginTransaction();

        
        $query = "SELECT * FROM sales WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->sale_id);
        $stmt->execute();
        $sale = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$sale) throw new Exception("Sale not found.");
        if ($sale['status'] === 'voided') throw new Exception("Sale already voided.");

        
        $updateQuery = "UPDATE sales SET status = 'voided' WHERE id = :id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':id', $data->sale_id);
        $updateStmt->execute();

        
        $itemsQuery = "SELECT product_id, quantity, branch_id FROM sale_items JOIN sales ON sale_items.sale_id = sales.id WHERE sale_id = :id";
        $itemsStmt = $db->prepare($itemsQuery);
        $itemsStmt->bindParam(':id', $data->sale_id);
        $itemsStmt->execute();
        $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        $restoreQuery = "UPDATE inventory SET quantity = quantity + :qty WHERE product_id = :pid AND branch_id = :bid";
        $restoreStmt = $db->prepare($restoreQuery);

        foreach ($items as $item) {
            $branchId = $sale['branch_id']; 
            $restoreStmt->bindParam(':qty', $item['quantity']);
            $restoreStmt->bindParam(':pid', $item['product_id']);
            $restoreStmt->bindParam(':bid', $branchId);
            $restoreStmt->execute();
        }

        
        Logger::log($db, $data->admin_id, 'Void Sale', "Voided Transaction ID: " . $sale['transaction_id']);

        $db->commit();
        echo json_encode(array("message" => "Sale voided successfully. Stock restored."));

    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(array("message" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
