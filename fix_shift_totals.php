<?php
include_once 'api/config/database.php';
include_once 'api/services/ShiftService.php';

$database = new Database();
$db = $database->getConnection();
$shiftService = new ShiftService($db);

try {
    $query = "SELECT id FROM shifts WHERE status = 'closed' AND total_sales = 0";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $shifts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($shifts as $shift) {
        $stats = $shiftService->getShiftStats($shift['id']);
        $total = $stats['total_sales'];
        
        $update = "UPDATE shifts SET total_sales = :total WHERE id = :id";
        $uStmt = $db->prepare($update);
        $uStmt->bindParam(':total', $total);
        $uStmt->bindParam(':id', $shift['id']);
        $uStmt->execute();
        echo "Updated shift ID " . $shift['id'] . " with total sales: " . $total . "\n";
    }
    echo "Recalculation complete.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
