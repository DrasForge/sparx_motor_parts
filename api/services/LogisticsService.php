<?php
include_once 'AuditService.php';
class LogisticsService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getBranchStock($branchId) {
        $query = "SELECT p.*, i.quantity as stock_quantity FROM products p 
                  JOIN inventory i ON p.sku = i.product_sku WHERE i.branch_id = :bid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':bid', $branchId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getProductStock($sku) {
        $query = "SELECT i.*, b.name as branch_name 
                  FROM inventory i 
                  JOIN branches b ON i.branch_id = b.id 
                  WHERE i.product_sku = :sku";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':sku', $sku);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createTransfer($data) {
        $query = "INSERT INTO transfers (source_branch_id, dest_branch_id, product_sku, quantity, status, requested_by, created_at) 
                  VALUES (:from, :to, :sku, :qty, 'pending', :uid, NOW())";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':from', $data->source_branch_id);
        $stmt->bindParam(':to', $data->dest_branch_id);
        $stmt->bindParam(':sku', $data->product_sku);
        $stmt->bindParam(':qty', $data->quantity);
        $stmt->bindParam(':uid', $data->requested_by);
        $stmt->execute();
        $transferId = $this->db->lastInsertId();

        $audit = new AuditService($this->db);
        $audit->log($data->requested_by, 'TRANSFER_REQUEST', "Requested transfer of {$data->quantity}x {$data->product_sku} from branch {$data->source_branch_id} to {$data->dest_branch_id}");

        return $transferId;
    }

    public function updateTransfer($id, $status, $approvedBy = null) {
        try {
            $this->db->beginTransaction();

            $userQuery = "SELECT role FROM users WHERE id = :uid";
            $userStmt = $this->db->prepare($userQuery);
            $userStmt->bindParam(':uid', $approvedBy);
            $userStmt->execute();
            $role = $userStmt->fetchColumn();

            if ($role !== 'admin') {
                throw new Exception("Only admin users can approve or reject transfer requests.");
            }

            $query = "SELECT * FROM transfers WHERE id = :id FOR UPDATE";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $transfer = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($status === 'approved' && $transfer['status'] !== 'approved') {
                // 1. Deduct from source
                $q1 = "UPDATE inventory SET quantity = quantity - :qty WHERE product_sku = :sku AND branch_id = :bid";
                $s1 = $this->db->prepare($q1);
                $s1->bindParam(':qty', $transfer['quantity']);
                $s1->bindParam(':sku', $transfer['product_sku']);
                $s1->bindParam(':bid', $transfer['source_branch_id']);
                $s1->execute();

                // 2. Add to destination (Create record if it doesn't exist)
                $q2 = "INSERT INTO inventory (product_sku, branch_id, quantity, reorder_point) 
                       VALUES (:sku, :bid, :qty, 10) 
                       ON DUPLICATE KEY UPDATE quantity = quantity + :qty_update";
                $s2 = $this->db->prepare($q2);
                $s2->bindParam(':sku', $transfer['product_sku']);
                $s2->bindParam(':bid', $transfer['dest_branch_id']);
                $s2->bindParam(':qty', $transfer['quantity']);
                $s2->bindParam(':qty_update', $transfer['quantity']);
                $s2->execute();
            }

            $q3 = "UPDATE transfers SET status = :status, approved_by = :uid, updated_at = NOW() WHERE id = :id";
            $s3 = $this->db->prepare($q3);
            $s3->bindParam(':status', $status);
            $s3->bindParam(':uid', $approvedBy);
            $s3->bindParam(':id', $id);
            $s3->execute();

            $this->db->commit();

            $audit = new AuditService($this->db);
            $details = "Transfer ID {$id} status updated to {$status}";
            $audit->log($approvedBy, 'TRANSFER_STATUS', $details);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getTransfers($branchId = null) {
        $query = "SELECT t.*, p.name as product_name, p.sku, b1.name as source_branch_name, b2.name as dest_branch_name, u.username as requested_by_name 
                  FROM transfers t 
                  JOIN products p ON t.product_sku = p.sku 
                  JOIN branches b1 ON t.source_branch_id = b1.id 
                  JOIN branches b2 ON t.dest_branch_id = b2.id
                  JOIN users u ON t.requested_by = u.id";
        if ($branchId) {
            $query .= " WHERE t.source_branch_id = :bid OR t.dest_branch_id = :bid";
        }
        $query .= " ORDER BY t.created_at DESC";
        $stmt = $this->db->prepare($query);
        if ($branchId) $stmt->bindParam(':bid', $branchId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
