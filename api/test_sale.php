<?php
include_once 'config/database.php';
include_once 'services/SalesService.php';

try {
    $db = (new Database())->getConnection();
    $salesService = new SalesService($db);
    $transactionId = 'TRX-BAB5EE45-1772718560';

    echo "Querying for: $transactionId\n";
    $result = $salesService->getSaleByTransactionId($transactionId);
    
    if ($result) {
        echo "FOUND:\n";
        print_r($result);
    } else {
        echo "NOT FOUND.\n";
        
        $stmt = $db->prepare("SELECT * FROM sales WHERE transaction_id = :tid");
        $stmt->execute(['tid' => $transactionId]);
        $rawSale = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Raw Sale from DB:\n";
        print_r($rawSale);
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
