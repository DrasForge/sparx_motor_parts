<?php
include_once '../config/cors.php';
include_once '../config/database.php';
include_once '../config/Logger.php';

header("Content-Type: application/json; charset=UTF-8");

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->shift_id) && !empty($data->user_id) && isset($data->ending_cash)) {
    try {
        
        
        
        

        $salesQuery = "SELECT SUM(total) as total_sales, COUNT(*) as txn_count FROM sales WHERE shift_id = :sid";
        $salesStmt = $db->prepare($salesQuery);
        $salesStmt->bindParam(':sid', $data->shift_id);
        $salesStmt->execute();
        $salesData = $salesStmt->fetch(PDO::FETCH_ASSOC);
        $totalSales = $salesData['total_sales'] ? $salesData['total_sales'] : 0.00;

        
        $query = "UPDATE shifts SET end_time = NOW(), ending_cash = :ec, total_sales = :ts, status = 'closed' WHERE id = :sid";
        $stmt = $db->prepare($query);

        $stmt->bindParam(':ec', $data->ending_cash);
        $stmt->bindParam(':ts', $totalSales);
        $stmt->bindParam(':sid', $data->shift_id);

        if ($stmt->execute()) {
            Logger::log($db, $data->user_id, 'Shift Ended', "Shift ID: " . $data->shift_id . " | Total Sales: $totalSales");
            
            
            echo json_encode(array(
                "message" => "Shift ended successfully.",
                "summary" => array(
                    "shift_id" => $data->shift_id,
                    "total_sales" => $totalSales,
                    "txn_count" => $salesData['txn_count'],
                    "ending_cash" => $data->ending_cash
                )
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to end shift."));
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
