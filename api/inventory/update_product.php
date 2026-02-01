<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->id) &&
    !empty($data->sku) &&
    !empty($data->name) &&
    !empty($data->price)
) {
    try {
        $query = "UPDATE products 
                  SET sku = :sku, name = :name, category = :category, price = :price, cost_price = :cost, supplier_info = :supplier, updated_at = NOW() 
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);

        $category = isset($data->category) ? $data->category : 'General';
        $supplier = isset($data->supplier) ? $data->supplier : '';
        $costPrice = isset($data->cost_price) ? $data->cost_price : 0.00;

        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":sku", $data->sku);
        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":category", $category);
        $stmt->bindParam(":price", $data->price);
        $stmt->bindParam(":cost", $costPrice);
        $stmt->bindParam(":supplier", $supplier);

        if($stmt->execute()) {
            $adminId = isset($data->admin_id) ? $data->admin_id : null;
            if($adminId) {
                Logger::log($db, $adminId, 'Product Updated', "Updated Product ID: " . $data->id);
            }
            http_response_code(200);
            echo json_encode(array("message" => "Product updated successfully."));
        } else {
            throw new Exception("Unable to update product.");
        }
    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to update product. " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
