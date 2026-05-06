<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../services/SalesService.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

// Accept either user_id or cashier_id from the frontend
if (!empty($data->user_id) && empty($data->cashier_id)) {
    $data->cashier_id = $data->user_id;
}
// Accept either total_amount or total
if (!empty($data->total_amount) && empty($data->total)) {
    $data->total = $data->total_amount;
}

// Defaults for required database fields
if (!isset($data->subtotal)) $data->subtotal = $data->total;
if (!isset($data->tax_amount)) $data->tax_amount = 0;
if (!isset($data->discount_amount)) $data->discount_amount = 0;
if (!isset($data->shift_id)) $data->shift_id = null;

// Normalize item fields: frontend sends product_sku, service expects sku or product_sku
if (!empty($data->items)) {
    foreach ($data->items as $item) {
        if (!empty($item->product_sku) && empty($item->sku)) {
            $item->sku = $item->product_sku;
        }
        if (!empty($item->sku) && empty($item->product_sku)) {
            $item->product_sku = $item->sku;
        }
        if (!empty($item->quantity) && empty($item->cart_quantity)) {
            $item->cart_quantity = $item->quantity;
        }
        if (empty($item->subtotal)) {
            $item->subtotal = $item->price * $item->cart_quantity;
        }
    }
}

if(
    !empty($data->branch_id) &&
    !empty($data->cashier_id) &&
    !empty($data->items) &&
    !empty($data->total)
) {
    try {
        $salesService = new SalesService($db);
        $result = $salesService->createSale($data);

        http_response_code(201);
        echo json_encode(array_merge(["message" => "Sale processed successfully."], $result));

    } catch (Exception $e) {
        http_response_code(503);
        echo json_encode(["message" => "Transaction Failed: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data."]);
}
?>
