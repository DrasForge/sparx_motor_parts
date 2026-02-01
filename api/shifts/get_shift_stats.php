<?php
include_once '../config/cors.php';
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['shift_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "Shift ID is required."]);
    exit;
}

$shift_id = $_GET['shift_id'];

try {
    
    $shiftQuery = "SELECT starting_cash, start_time FROM shifts WHERE id = :sid";
    $stmt = $db->prepare($shiftQuery);
    $stmt->bindParam(':sid', $shift_id);
    $stmt->execute();
    $shift = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$shift) {
        throw new Exception("Shift not found.");
    }

    
    
    $cashQuery = "SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE shift_id = :sid AND payment_method = 'Cash'";
    $stmt = $db->prepare($cashQuery);
    $stmt->bindParam(':sid', $shift_id);
    $stmt->execute();
    $cashSales = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    
    $nonCashQuery = "SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE shift_id = :sid AND payment_method != 'Cash'";
    $stmt = $db->prepare($nonCashQuery);
    $stmt->bindParam(':sid', $shift_id);
    $stmt->execute();
    $nonCashSales = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    
    $countQuery = "SELECT COUNT(*) as count FROM sales WHERE shift_id = :sid";
    $stmt = $db->prepare($countQuery);
    $stmt->bindParam(':sid', $shift_id);
    $stmt->execute();
    $txn_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    $starting_cash = floatval($shift['starting_cash']);
    $cash_sales = floatval($cashSales);
    $expected_cash = $starting_cash + $cash_sales;

    echo json_encode([
        "shift_id" => $shift_id,
        "start_time" => $shift['start_time'],
        "starting_cash" => $starting_cash,
        "cash_sales" => $cash_sales,
        "non_cash_sales" => floatval($nonCashSales),
        "total_sales" => $cash_sales + floatval($nonCashSales),
        "expected_cash" => $expected_cash,
        "txn_count" => $txn_count
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(404);
    echo json_encode(["message" => $e->getMessage()]);
}
?>
