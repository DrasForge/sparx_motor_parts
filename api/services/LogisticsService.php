<?php
class LogisticsService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getBranchStock($branchId) {
        $query = "SELECT p.*, i.quantity as stock_quantity FROM products p 
                  JOIN inventory i ON p.id = i.product_id WHERE i.branch_id = :bid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':bid', $branchId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createTransfer($data) {
        $query = "INSERT INTO transfers (source_branch_id, destination_branch_id, product_id, quantity, status, requested_by, created_at) 
                  VALUES (:from, :to, :pid, :qty, 'pending', :uid, NOW())";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':from', $data->from_branch_id);
        $stmt->bindParam(':to', $data->to_branch_id);
        $stmt->bindParam(':pid', $data->product_id);
        $stmt->bindParam(':qty', $data->quantity);
        $stmt->bindParam(':uid', $data->requested_by);
        $stmt->execute();
        return $this->db->lastInsertId();
    }

    public function updateTransfer($id, $status, $approvedBy = null) {
        try {
            $this->db->beginTransaction();

            $query = "SELECT * FROM transfers WHERE id = :id FOR UPDATE";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $transfer = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($status === 'approved' && $transfer['status'] !== 'approved') {
                $q1 = "UPDATE inventory SET quantity = quantity - :qty WHERE product_id = :pid AND branch_id = :bid";
                $s1 = $this->db->prepare($q1);
                $s1->bindParam(':qty', $transfer['quantity']);
                $s1->bindParam(':pid', $transfer['product_id']);
                $s1->bindParam(':bid', $transfer['source_branch_id']);
                $s1->execute();

                $q2 = "UPDATE inventory SET quantity = quantity + :qty WHERE product_id = :pid AND branch_id = :bid";
                $s2 = $this->db->prepare($q2);
                $s2->bindParam(':qty', $transfer['quantity']);
                $s2->bindParam(':pid', $transfer['product_id']);
                $s2->bindParam(':bid', $transfer['destination_branch_id']);
                $s2->execute();
            }

            $q3 = "UPDATE transfers SET status = :status, approved_by = :uid, updated_at = NOW() WHERE id = :id";
            $s3 = $this->db->prepare($q3);
            $s3->bindParam(':status', $status);
            $s3->bindParam(':uid', $approvedBy);
            $s3->bindParam(':id', $id);
            $s3->execute();

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getTransfers($branchId = null) {
        $query = "SELECT t.*, p.name as product_name, p.sku, b1.name as source_branch_name, b2.name as dest_branch_name, u.username as requested_by_name 
                  FROM transfers t 
                  JOIN products p ON t.product_id = p.id 
                  JOIN branches b1 ON t.source_branch_id = b1.id 
                  JOIN branches b2 ON t.destination_branch_id = b2.id
                  JOIN users u ON t.requested_by = u.id";
        if ($branchId) {
            $query .= " WHERE t.source_branch_id = :bid OR t.destination_branch_id = :bid";
        }
        $query .= " ORDER BY t.created_at DESC";
        $stmt = $this->db->prepare($query);
        if ($branchId) $stmt->bindParam(':bid', $branchId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
