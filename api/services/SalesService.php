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
}
?>
