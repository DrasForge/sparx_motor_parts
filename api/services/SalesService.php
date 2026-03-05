<?php
class SalesService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function createSale($data) {
        try {
            $this->db->beginTransaction();

            if (empty($data->transaction_id)) {
                $data->transaction_id = 'TRX-' . strtoupper(bin2hex(random_bytes(4))) . '-' . time();
            }

            $query = "INSERT INTO sales (transaction_id, cashier_id, branch_id, shift_id, subtotal, tax_amount, discount_amount, total, status, created_at, payment_method) 
                      VALUES (:tid, :cid, :bid, :sid, :sub, :tax, :disc, :total, 'completed', NOW(), :pm)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':tid', $data->transaction_id);
            $stmt->bindParam(':cid', $data->cashier_id);
            $stmt->bindParam(':bid', $data->branch_id);
            $stmt->bindParam(':sid', $data->shift_id);
            $stmt->bindParam(':sub', $data->subtotal);
            $stmt->bindParam(':tax', $data->tax_amount);
            $stmt->bindParam(':disc', $data->discount_amount);
            $stmt->bindParam(':total', $data->total);
            $stmt->bindParam(':pm', $data->payment_method);
            $stmt->execute();
            $saleId = $this->db->lastInsertId();

            foreach ($data->items as $item) {
                $q2 = "INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) 
                       VALUES (:sid, :pid, :qty, :price, :sub)";
                $s2 = $this->db->prepare($q2);
                $s2->bindParam(':sid', $saleId);
                $s2->bindParam(':pid', $item->id);
                $s2->bindParam(':qty', $item->cart_quantity);
                $s2->bindParam(':price', $item->price);
                $s2->bindParam(':sub', $item->subtotal);
                $s2->execute();

                $q3 = "UPDATE inventory SET quantity = quantity - :qty 
                       WHERE product_id = :pid AND branch_id = :bid";
                $s3 = $this->db->prepare($q3);
                $s3->bindParam(':qty', $item->cart_quantity);
                $s3->bindParam(':pid', $item->id);
                $s3->bindParam(':bid', $data->branch_id);
                $s3->execute();
            }

            $this->db->commit();
            return [
                "id" => $saleId,
                "transaction_id" => $data->transaction_id
            ];
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function voidSale($saleId, $adminId) {
        try {
            $this->db->beginTransaction();

            $query = "SELECT * FROM sales WHERE id = :id FOR UPDATE";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $saleId);
            $stmt->execute();
            $sale = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$sale) throw new Exception("Sale not found.");
            if ($sale['status'] === 'voided') throw new Exception("Sale already voided.");

            $updateQuery = "UPDATE sales SET status = 'voided' WHERE id = :id";
            $updateStmt = $this->db->prepare($updateQuery);
            $updateStmt->bindParam(':id', $saleId);
            $updateStmt->execute();

            $itemsQuery = "SELECT product_id, quantity FROM sale_items WHERE sale_id = :id";
            $itemsStmt = $this->db->prepare($itemsQuery);
            $itemsStmt->bindParam(':id', $saleId);
            $itemsStmt->execute();
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($items as $item) {
                $restoreQuery = "UPDATE inventory SET quantity = quantity + :qty WHERE product_id = :pid AND branch_id = :bid";
                $restoreStmt = $this->db->prepare($restoreQuery);
                $restoreStmt->bindParam(':qty', $item['quantity']);
                $restoreStmt->bindParam(':pid', $item['product_id']);
                $restoreStmt->bindParam(':bid', $sale['branch_id']);
                $restoreStmt->execute();
            }

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getSaleByTransactionId($transactionId) {
        $query = "SELECT s.*, u.username as cashier_name 
                  FROM sales s 
                  JOIN users u ON s.cashier_id = u.id 
                  WHERE s.transaction_id = :tid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':tid', $transactionId);
        $stmt->execute();
        $sale = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$sale) {
            return null;
        }

        $itemsQuery = "
            SELECT si.product_id, si.quantity, si.price as price_at_sale, p.name, p.sku,
            COALESCE((
                SELECT SUM(ri.quantity) 
                FROM return_items ri 
                JOIN returns r ON ri.return_id = r.id 
                WHERE ri.product_id = si.product_id AND r.sale_id = si.sale_id
            ), 0) as returned_qty
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = :sid
        ";
        $itemsStmt = $this->db->prepare($itemsQuery);
        $itemsStmt->bindParam(':sid', $sale['id']);
        $itemsStmt->execute();
        $sale['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        return $sale;
    }

    public function processReturn($data) {
        try {
            $this->db->beginTransaction();

            // Insert into returns table
            $query = "INSERT INTO returns (sale_id, cashier_id, shift_id, total_refund, created_at) 
                      VALUES (:sid, :cid, :shift, :total, NOW())";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':sid', $data->sale_id);
            $stmt->bindParam(':cid', $data->cashier_id);
            $stmt->bindParam(':shift', $data->shift_id);
            $stmt->bindParam(':total', $data->total_refund);
            $stmt->execute();
            $returnId = $this->db->lastInsertId();

            if (empty($data->items)) {
                throw new Exception("No items provided for return");
            }

            foreach ($data->items as $item) {
                // Insert into return_items
                $q2 = "INSERT INTO return_items (return_id, product_id, quantity, refund_amount, condition_status) 
                       VALUES (:rid, :pid, :qty, :amount, :cond)";
                $s2 = $this->db->prepare($q2);
                $s2->bindParam(':rid', $returnId);
                $s2->bindParam(':pid', $item->product_id);
                $s2->bindParam(':qty', $item->quantity);
                $s2->bindParam(':amount', $item->refund_amount);
                $s2->bindParam(':cond', $item->condition_status);
                $s2->execute();

                // If condition is 'good', restock inventory
                if ($item->condition_status === 'good') {
                    $q3 = "UPDATE inventory SET quantity = quantity + :qty 
                           WHERE product_id = :pid AND branch_id = :bid";
                    $s3 = $this->db->prepare($q3);
                    $s3->bindParam(':qty', $item->quantity);
                    $s3->bindParam(':pid', $item->product_id);
                    $s3->bindParam(':bid', $item->branch_id);
                    $s3->execute();
                }
            }

            // Calculate the total number of items originally in the sale
            $totalSaleItemsQuery = "SELECT SUM(quantity) as total_qty FROM sale_items WHERE sale_id = :sid";
            $totalSaleItemsStmt = $this->db->prepare($totalSaleItemsQuery);
            $totalSaleItemsStmt->bindParam(':sid', $data->sale_id);
            $totalSaleItemsStmt->execute();
            $totalSaleItemsResult = $totalSaleItemsStmt->fetch(PDO::FETCH_ASSOC);
            $totalOriginalQty = $totalSaleItemsResult['total_qty'] ?? 0;

            // Calculate the total number of items currently being returned + previously returned
            $totalReturnedQuery = "SELECT SUM(ri.quantity) as total_returned 
                                    FROM return_items ri 
                                    JOIN returns r ON ri.return_id = r.id 
                                    WHERE r.sale_id = :sid";
            $totalReturnedStmt = $this->db->prepare($totalReturnedQuery);
            $totalReturnedStmt->bindParam(':sid', $data->sale_id);
            $totalReturnedStmt->execute();
            $totalReturnedResult = $totalReturnedStmt->fetch(PDO::FETCH_ASSOC);
            $totalReturnedQty = $totalReturnedResult['total_returned'] ?? 0;

            // Update the sale status
            $newStatus = ($totalReturnedQty >= $totalOriginalQty) ? 'refunded' : 'partial_refund';
            
            $updateSaleStatusQuery = "UPDATE sales SET status = :status WHERE id = :sid";
            $updateSaleStatusStmt = $this->db->prepare($updateSaleStatusQuery);
            $updateSaleStatusStmt->bindParam(':status', $newStatus);
            $updateSaleStatusStmt->bindParam(':sid', $data->sale_id);
            $updateSaleStatusStmt->execute();

            $this->db->commit();
            return ["id" => $returnId, "message" => "Return processed successfully"];
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getTotalRefundedToday($branchId) {
        $query = "SELECT SUM(r.total_refund) as total 
                  FROM returns r
                  JOIN sales s ON r.sale_id = s.id
                  WHERE DATE(r.created_at) = CURDATE() 
                  AND s.branch_id = :bid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':bid', $branchId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'] ? (float)$row['total'] : 0.0;
    }
}
?>
