<?php
class InventoryService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAllProducts($branch_id = null, $page = 1, $limit = 12, $search = '') {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT p.*, IFNULL(i.quantity, 0) as stock_quantity 
                  FROM products p 
                  LEFT JOIN inventory i ON p.id = i.product_id AND i.branch_id = :bid";
        $conditions = [];
        $params = [':bid' => $branch_id ?: 1];

        if ($search) {
            $conditions[] = "(p.name LIKE :search OR p.sku LIKE :search)";
            $params[':search'] = "%$search%";
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $countQuery = "SELECT COUNT(*) as total FROM products p";
        if ($search) $countQuery .= " WHERE (p.name LIKE :search OR p.sku LIKE :search)";
        
        $stmt = $this->db->prepare($countQuery);
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

    public function createProduct($data) {
        $query = "INSERT INTO products (sku, name, description, category, price, cost_price, supplier_info) 
                  VALUES (:sku, :name, :desc, :cat, :price, :cost, :supplier)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':sku', $data->sku);
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':desc', $data->description);
        $stmt->bindParam(':cat', $data->category);
        $stmt->bindParam(':price', $data->price);
        $stmt->bindParam(':cost', $data->cost_price);
        $stmt->bindParam(':supplier', $data->supplier);
        $stmt->execute();
        $productId = $this->db->lastInsertId();

        $q2 = "INSERT INTO inventory (product_id, branch_id, quantity) VALUES (:pid, :bid, :qty)";
        $s2 = $this->db->prepare($q2);
        $s2->bindParam(':pid', $productId);
        $branchId = $data->branch_id ?? 1;
        $s2->bindParam(':bid', $branchId);
        $qty = $data->stock_quantity ?? 0;
        $s2->bindParam(':qty', $qty);
        $s2->execute();

        return $productId;
    }

    public function updateProduct($id, $data) {
        $query = "UPDATE products SET sku = :sku, name = :name, description = :desc, 
                  category = :cat, price = :price, cost_price = :cost, supplier_info = :supplier 
                  WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':sku', $data->sku);
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':desc', $data->description);
        $stmt->bindParam(':cat', $data->category);
        $stmt->bindParam(':price', $data->price);
        $stmt->bindParam(':cost', $data->cost_price);
        $stmt->bindParam(':supplier', $data->supplier);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $q2 = "INSERT INTO inventory (product_id, branch_id, quantity) 
               VALUES (:pid, :bid, :qty) 
               ON DUPLICATE KEY UPDATE quantity = :qty";
        $s2 = $this->db->prepare($q2);
        $s2->bindParam(':pid', $id);
        $branchId = $data->branch_id ?? 1;
        $s2->bindParam(':bid', $branchId);
        $qty = $data->stock_quantity ?? 0;
        $s2->bindParam(':qty', $qty);
        $s2->execute();
    }

    public function deleteProduct($id) {
        $query = "DELETE FROM products WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
    }

    public function bulkCreateProducts($products) {
        try {
            $this->db->beginTransaction();
            $pQuery = "INSERT INTO products (sku, name, description, category, price, cost_price, supplier_info) 
                       VALUES (:sku, :name, :desc, :cat, :price, :cost, :supplier)";
            $pStmt = $this->db->prepare($pQuery);

            $iQuery = "INSERT INTO inventory (product_id, branch_id, quantity) VALUES (:pid, :bid, :qty)";
            $iStmt = $this->db->prepare($iQuery);

            foreach ($products as $data) {
                // Insert Product
                $pStmt->bindParam(':sku', $data['sku']);
                $pStmt->bindParam(':name', $data['name']);
                $pStmt->bindParam(':desc', $data['description']);
                $pStmt->bindParam(':cat', $data['category']);
                $pStmt->bindParam(':price', $data['price']);
                $pStmt->bindParam(':cost', $data['cost_price']);
                $pStmt->bindParam(':supplier', $data['supplier']);
                $pStmt->execute();
                $productId = $this->db->lastInsertId();

                // Insert Inventory for branch
                $iStmt->bindParam(':pid', $productId);
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

    public function updateStock($product_id, $branch_id, $qty) {
        $query = "UPDATE inventory SET quantity = quantity + :qty 
                  WHERE product_id = :pid AND branch_id = :bid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':qty', $qty);
        $stmt->bindParam(':pid', $product_id);
        $stmt->bindParam(':bid', $branch_id);
        $stmt->execute();
    }
}
?>
