<?php
include_once __DIR__ . '/../api/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Starting Integration Test: Stock Transfer...\n";


$productId = 1;
$sourceBranch = 1;
$destBranch = 2;
$qty = 10;


function getStock($db, $pid, $bid) {
    $stmt = $db->prepare("SELECT quantity FROM inventory WHERE product_id = ? AND branch_id = ?");
    $stmt->execute([$pid, $bid]);
    return $stmt->fetchColumn() ?: 0;
}

$initialSource = getStock($db, $productId, $sourceBranch);
$initialDest = getStock($db, $productId, $destBranch);

echo "Initial Stock - Source: $initialSource, Dest: $initialDest\n";

if ($initialSource < $qty) {
    echo "Setup: Adding stock to source...\n";
    $db->prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?")
       ->execute([$productId, $sourceBranch, 100, 100]);
    $initialSource += 100;
}


try {
    $db->beginTransaction();

    
    $upd1 = $db->prepare("UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND branch_id = ?");
    $upd1->execute([$qty, $productId, $sourceBranch]);

    
    $upd2 = $db->prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?");
    $upd2->execute([$productId, $destBranch, $qty, $qty]);

    $db->commit();
    echo "Transfer executed.\n";

} catch (Exception $e) {
    $db->rollBack();
    die("Transaction Failed: " . $e->getMessage());
}


$finalSource = getStock($db, $productId, $sourceBranch);
$finalDest = getStock($db, $productId, $destBranch);

echo "Final Stock - Source: $finalSource, Dest: $finalDest\n";

if ($finalSource == ($initialSource - $qty) && $finalDest == ($initialDest + $qty)) {
    echo "PASS: Stock updated correctly.\n";
} else {
    echo "FAIL: Stock mismatch.\n";
    exit(1);
}
?>
