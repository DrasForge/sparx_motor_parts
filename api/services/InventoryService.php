<?php
include_once 'AuditService.php';
class InventoryService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAllProducts($branch_id = null, $page = 1, $limit = 12, $search = '') {
        $offset = ($page - 1) * $limit;
        
        // Strictly use the passed branch_id if available, otherwise default to 1
        $bid = ($branch_id !== null && $branch_id !== '') ? (int)$branch_id : 1;
        
        $query = "SELECT p.*, c.name as category_name, i.quantity as stock_quantity 
                  FROM products p 
                  INNER JOIN inventory i ON p.sku = i.product_sku
                  LEFT JOIN categories c ON p.category_id = c.id
                  WHERE i.branch_id = :bid";
        
        $params = [':bid' => $bid];

        if ($search) {
            $query .= " AND (p.name LIKE :search OR p.sku LIKE :search)";
            $params[':search'] = "%$search%";
        }

        $countQuery = "SELECT COUNT(*) as total FROM products p JOIN inventory i ON p.sku = i.product_sku WHERE i.branch_id = :bid";
        if ($search) $countQuery .= " AND (p.name LIKE :search OR p.sku LIKE :search)";
        
        $stmt = $this->db->prepare($countQuery);
        $stmt->bindValue(':bid', $bid, PDO::PARAM_INT);
        if ($search) $stmt->bindValue(':search', $params[':search']);
        $stmt->execute();
        $totalItems = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        $query .= " LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($query);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            "data" => $products,
            "pagination" => [
                "current_page" => (int)$page,
                "total_pages" => ceil($totalItems / $limit),
                "total_items" => (int)$totalItems
            ]
        ];
    }

    public function createProduct($data, $userId) {
        // Ensure at least one category exists
        $catCheck = $this->db->query("SELECT COUNT(*) FROM categories")->fetchColumn();
        if ($catCheck == 0) {
            throw new Exception("Please create a category first.");
        }

        $query = "INSERT INTO products (sku, name, description, category_id, price, cost_price, supplier_info, is_quick_access) 
                  VALUES (:sku, :name, :desc, :cat, :price, :cost, :supplier, :quick)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':sku', $data->sku);
        $stmt->bindParam(':name', $data->name);
        $desc = $data->description ?? '';
        $stmt->bindParam(':desc', $desc);
        $stmt->bindParam(':cat', $data->category_id);
        
        $price = !empty($data->price) ? $data->price : 0;
        $cost = !empty($data->cost_price) ? $data->cost_price : 0;
        
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':cost', $cost);
        $stmt->bindParam(':supplier', $data->supplier);
        $quick = !empty($data->is_quick_access) ? 1 : 0;
        $stmt->bindParam(':quick', $quick);
        $stmt->execute();

        $q2 = "INSERT INTO inventory (product_sku, branch_id, quantity) VALUES (:sku, :bid, :qty)";
        $s2 = $this->db->prepare($q2);
        $s2->bindParam(':sku', $data->sku);
        $branchId = $data->branch_id ?? 1;
        $s2->bindParam(':bid', $branchId);
        $qty = $data->stock_quantity ?? 0;
        $s2->bindParam(':qty', $qty);
        $s2->execute();

        $audit = new AuditService($this->db);
        $audit->log($userId, 'PRODUCT_CREATE', "Created product {$data->sku} ({$data->name}) at branch {$branchId}");

        return $data->sku;
    }

    public function updateProduct($sku, $data, $userId) {
        $query = "UPDATE products SET name = :name, description = :desc, 
                  category_id = :cat, price = :price, cost_price = :cost, supplier_info = :supplier,
                  is_quick_access = :quick 
                  WHERE sku = :sku";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':name', $data->name);
        $desc = $data->description ?? '';
        $stmt->bindParam(':desc', $desc);
        $stmt->bindParam(':cat', $data->category_id);
        
        $price = !empty($data->price) ? $data->price : 0;
        $cost = !empty($data->cost_price) ? $data->cost_price : 0;
        
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':cost', $cost);
        $stmt->bindParam(':supplier', $data->supplier);
        $quick = !empty($data->is_quick_access) ? 1 : 0;
        $stmt->bindParam(':quick', $quick);
        $stmt->bindParam(':sku', $sku);
        $stmt->execute();

        $q2 = "INSERT INTO inventory (product_sku, branch_id, quantity) 
               VALUES (:sku, :bid, :qty) 
               ON DUPLICATE KEY UPDATE quantity = :qty";
        $s2 = $this->db->prepare($q2);
        $s2->bindParam(':sku', $sku);
        $branchId = $data->branch_id ?? 1;
        $s2->bindParam(':bid', $branchId);
        $qty = $data->stock_quantity ?? 0;
        $s2->bindParam(':qty', $qty);
        $s2->execute();

        $audit = new AuditService($this->db);
        $audit->log($userId, 'PRODUCT_UPDATE', "Updated product {$sku} ({$data->name}) details.");
    }

    public function deleteProduct($sku, $userId) {
        $query = "DELETE FROM products WHERE sku = :sku";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':sku', $sku);
        $stmt->execute();

        $audit = new AuditService($this->db);
        $audit->log($userId, 'PRODUCT_DELETE', "Deleted product {$sku}");
    }

    public function bulkCreateProducts($products) {
        try {
            $this->db->beginTransaction();
            $pQuery = "INSERT INTO products (sku, name, description, category_id, price, cost_price, supplier_info, is_quick_access) 
                       VALUES (:sku, :name, :desc, :cat, :price, :cost, :supplier, :quick)";
            $pStmt = $this->db->prepare($pQuery);

            $iQuery = "INSERT INTO inventory (product_sku, branch_id, quantity) VALUES (:sku, :bid, :qty)";
            $iStmt = $this->db->prepare($iQuery);

            foreach ($products as $data) {
                // Insert Product
                $pStmt->bindParam(':sku', $data['sku']);
                $pStmt->bindParam(':name', $data['name']);
                $pStmt->bindParam(':desc', $data['description']);
                $pStmt->bindParam(':cat', $data['category_id']);
                $pStmt->bindParam(':price', $data['price']);
                $pStmt->bindParam(':cost', $data['cost_price']);
                $pStmt->bindParam(':supplier', $data['supplier']);
                $quick = !empty($data['is_quick_access']) ? 1 : 0;
                $pStmt->bindParam(':quick', $quick);
                $pStmt->execute();

                // Insert Inventory for branch
                $iStmt->bindParam(':sku', $data['sku']);
                $branchId = $data['branch_id'] ?? 1;
                $iStmt->bindParam(':bid', $branchId);
                $qty = $data['stock_quantity'] ?? 0;
                $iStmt->bindParam(':qty', $qty);
                $iStmt->execute();
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function updateStock($sku, $branch_id, $qty) {
        $query = "UPDATE inventory SET quantity = quantity + :qty 
                  WHERE product_sku = :sku AND branch_id = :bid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':qty', $qty);
        $stmt->bindParam(':sku', $sku);
        $stmt->bindParam(':bid', $branch_id);
        $stmt->execute();
    }

    public function checkSkuExists($sku) {
        $query = "SELECT COUNT(*) FROM products WHERE sku = :sku";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':sku', $sku);
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }

    public function adjustStock($data) {
        try {
            $this->db->beginTransaction();

            // 1. Log adjustment
            $q1 = "INSERT INTO inventory_adjustments (product_sku, branch_id, user_id, adjustment_type, quantity, reason, notes) 
                   VALUES (:sku, :bid, :uid, :type, :qty, :reason, :notes)";
            $s1 = $this->db->prepare($q1);
            $s1->bindParam(':sku', $data->sku);
            $s1->bindParam(':bid', $data->branch_id);
            $s1->bindParam(':uid', $data->user_id);
            $s1->bindParam(':type', $data->adjustment_type);
            $s1->bindParam(':qty', $data->quantity);
            $s1->bindParam(':reason', $data->reason);
            $s1->bindParam(':notes', $data->notes);
            $s1->execute();

            // 2. Update Inventory
            $qtyChange = ($data->adjustment_type === 'add') ? $data->quantity : -$data->quantity;
            
            $q2 = "INSERT INTO inventory (product_sku, branch_id, quantity) 
                   VALUES (:sku, :bid, :qty) 
                   ON DUPLICATE KEY UPDATE quantity = quantity + :qty_change";
            $s2 = $this->db->prepare($q2);
            $s2->bindParam(':sku', $data->sku);
            $s2->bindParam(':bid', $data->branch_id);
            $s2->bindParam(':qty', $qtyChange); // If new entry, use the adjustment quantity
            $s2->bindParam(':qty_change', $qtyChange);
            $s2->execute();

            $this->db->commit();

            $audit = new AuditService($this->db);
            $audit->log($data->user_id, 'INVENTORY_ADJUST', "Adjusted stock for {$data->sku} at branch {$data->branch_id}: {$data->adjustment_type} {$data->quantity}");

            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function generateRandomSku($prefix = 'SPX') {
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        do {
            $sku = $prefix . '-' . substr(str_shuffle($characters), 0, 8);
            $exists = $this->checkSkuExists($sku);
        } while ($exists);
        return $sku;
    }
}
?>
