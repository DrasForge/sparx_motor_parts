<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->sku) &&
    !empty($data->name) &&
    !empty($data->price)
) {
    try {
        $db->beginTransaction();

        $category = isset($data->category) ? $data->category : 'General';
        $supplier = isset($data->supplier) ? $data->supplier : '';
        $costPrice = isset($data->cost_price) ? $data->cost_price : 0.00;

        $query = "INSERT INTO products (sku, name, category, price, cost_price, supplier_info) VALUES (:sku, :name, :category, :price, :cost, :supplier)";
        $stmt = $db->prepare($query);

        $stmt->bindParam(":sku", $data->sku);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":category", $category);
        $stmt->bindParam(":price", $data->price);
        $stmt->bindParam(":cost", $costPrice);
        $stmt->bindParam(":supplier", $supplier);

        if($stmt->execute()) {
            $product_id = $db->lastInsertId();

            
            $branchQuery = "SELECT id FROM branches";
            $branches = $db->query($branchQuery)->fetchAll(PDO::FETCH_COLUMN);

            $invStmt = $db->prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (:pid, :bid, 0)");
            
            foreach($branches as $bid) {
                $invStmt->bindParam(':pid', $product_id);
                $invStmt->bindParam(':bid', $bid);
                $invStmt->execute();
            }

            
            $adminId = isset($data->admin_id) ? $data->admin_id : null;
            if($adminId) {
                Logger::log($db, $adminId, 'Product Created', "SKU: " . $data->sku . " | Name: " . $data->name);
            }

            $db->commit();
            http_response_code(201);
            echo json_encode(array("message" => "Product created successfully."));
        } else {
            throw new Exception("Unable to create product.");
        }
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create product. " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data. code:400"));
}
?>
