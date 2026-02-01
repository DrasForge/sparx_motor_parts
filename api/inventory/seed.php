<?php
include_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Seeding Database with 5,000 Products...\n";

$db->beginTransaction();

try {
    
    $prodStmt = $db->prepare("INSERT INTO products (sku, name, category, price, supplier_info) VALUES (:sku, :name, :category, :price, :supplier)");
    $invStmt = $db->prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (:pid, :bid, :qty)");

    $categories = ['Engine', 'Tires', 'Brakes', 'Oil', 'Accessories', 'Electrical', 'Chassis'];
    
    
    $stmt = $db->prepare("SELECT id FROM branches");
    $stmt->execute();
    $branchIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($branchIds)) {
        die("No branches found. Please seed branches first.");
    }

    for ($i = 1; $i <= 5000; $i++) {
        $sku = "SKU-" . str_pad($i, 5, '0', STR_PAD_LEFT);
        $name = "Product Item " . $i;
        $category = $categories[array_rand($categories)];
        $price = rand(100, 10000) / 100; 
        $supplier = "Supplier " . rand(1, 10);

        
        $prodStmt->bindParam(':sku', $sku);
        $prodStmt->bindParam(':name', $name);
        $prodStmt->bindParam(':category', $category);
        $prodStmt->bindParam(':price', $price);
        $prodStmt->bindParam(':supplier', $supplier);
        $prodStmt->execute();
        
        $productId = $db->lastInsertId();

        
        foreach ($branchIds as $bid) {
            $qty = rand(0, 100);
            $invStmt->bindParam(':pid', $productId);
            $invStmt->bindParam(':bid', $bid);
            $invStmt->bindParam(':qty', $qty);
            $invStmt->execute();
        }

        if ($i % 500 == 0) echo "Seeded $i products...\n";
    }

    $db->commit();
    echo "Seeding Complete!\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "Error: " . $e->getMessage();
}
?>
