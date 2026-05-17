<?php
include_once 'AuditService.php';
class ShiftService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function checkStatus($userId) {
        $query = "SELECT * FROM shifts WHERE user_id = :uid AND status = 'open' LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function startShift($userId, $branchId, $startingCash) {
        $query = "INSERT INTO shifts (user_id, branch_id, starting_cash, status, start_time) 
                  VALUES (:uid, :bid, :cash, 'open', NOW())";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->bindParam(':bid', $branchId);
        $stmt->bindParam(':cash', $startingCash);
        $stmt->execute();
        $shiftId = $this->db->lastInsertId();

        $audit = new AuditService($this->db);
        $audit->log($userId, 'SHIFT_START', "Started shift at branch {$branchId} with ₱{$startingCash} cash.");

        return $shiftId;
    }

    public function endShift($shiftId, $endingCash) {
        $stats = $this->getShiftStats($shiftId);
        $expected = $stats['expected_cash'];
        $difference = $endingCash - $expected;

        $query = "UPDATE shifts SET ending_cash = :ecash, total_sales = :total, status = 'closed', end_time = NOW() WHERE id = :sid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':ecash', $endingCash);
        $stmt->bindParam(':total', $stats['total_sales']);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();

        $query = "SELECT user_id FROM shifts WHERE id = :sid";
        $s = $this->db->prepare($query);
        $s->bindParam(':sid', $shiftId);
        $s->execute();
        $uid = $s->fetchColumn();

        $audit = new AuditService($this->db);
        $audit->log($uid, 'SHIFT_END', "Closed shift ID {$shiftId}. Sales: ₱{$stats['total_sales']}, Ending Cash: ₱{$endingCash}");

        return [
            "shift_id" => $shiftId,
            "total_sales" => $stats['total_sales'],
            "total_refunded" => $stats['total_refunded'],
            "txn_count" => $stats['txn_count'],
            "ending_cash" => $endingCash,
            "difference" => $difference
        ];
    }

    public function getShiftStats($shiftId) {
        // Get starting cash
        $query = "SELECT starting_cash FROM shifts WHERE id = :sid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();
        $start = $stmt->fetch(PDO::FETCH_ASSOC)['starting_cash'] ?? 0;

        // Get ALL sales for the report
        $salesQuery = "SELECT 
                        SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_sales,
                        SUM(total) as total_sales_all,
                        COUNT(*) as txn_count 
                       FROM sales 
                       WHERE shift_id = :sid 
                       AND status IN ('completed', 'refunded', 'partial_refund')";
        $stmt = $this->db->prepare($salesQuery);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();
        $sales = $stmt->fetch(PDO::FETCH_ASSOC);

        $cashSales = (float)($sales['cash_sales'] ?? 0);

        // Get total refunds processed in this shift
        $refundsQuery = "SELECT SUM(total_refund) as total_refunded FROM returns WHERE shift_id = :sid";
        $stmt = $this->db->prepare($refundsQuery);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();
        $refunds = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $totalRefunded = (float)($refunds['total_refunded'] ?? 0);

        return [
            "starting_cash" => $start,
            "cash_sales" => $cashSales,
            "total_refunded" => $totalRefunded,
            "expected_cash" => $start + $cashSales - $totalRefunded,
            "total_sales" => (float)($sales['total_sales_all'] ?? 0),
            "txn_count" => $sales['txn_count'] ?? 0
        ];
    }

    public function getShifts($status = null, $branchId = null, $start = null, $end = null) {
        $query = "SELECT
                    sh.*,
                    u.username as cashier_name,
                    b.name as branch_name,
                    TIMESTAMPDIFF(MINUTE, sh.start_time, COALESCE(sh.end_time, NOW())) as duration_minutes,
                    COALESCE(s.cash_sales, 0) as cash_sales,
                    COALESCE(s.gcash_sales, 0) as gcash_sales,
                    COALESCE(s.total_sales, 0) as total_sales_calculated,
                    COALESCE(s.txn_count, 0) as txn_count,
                    COALESCE(si.items_sold, 0) as items_sold,
                    COALESCE(r.total_refunded, 0) as total_refunded,
                    (sh.starting_cash + COALESCE(s.cash_sales, 0) - COALESCE(r.total_refunded, 0)) as expected_cash,
                    CASE
                        WHEN sh.status = 'closed' THEN sh.ending_cash - (sh.starting_cash + COALESCE(s.cash_sales, 0) - COALESCE(r.total_refunded, 0))
                        ELSE NULL
                    END as difference
                  FROM shifts sh
                  JOIN users u ON sh.user_id = u.id
                  JOIN branches b ON sh.branch_id = b.id
                  LEFT JOIN (
                    SELECT
                        shift_id,
                        SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_sales,
                        SUM(CASE WHEN payment_method = 'gcash' THEN total ELSE 0 END) as gcash_sales,
                        SUM(total) as total_sales,
                        COUNT(*) as txn_count
                    FROM sales
                    WHERE status IN ('completed', 'refunded', 'partial_refund')
                    GROUP BY shift_id
                  ) s ON sh.id = s.shift_id
                  LEFT JOIN (
                    SELECT s.shift_id, SUM(si.quantity) as items_sold
                    FROM sales s
                    JOIN sale_items si ON s.id = si.sale_id
                    WHERE s.status IN ('completed', 'refunded', 'partial_refund')
                    GROUP BY s.shift_id
                  ) si ON sh.id = si.shift_id
                  LEFT JOIN (
                    SELECT shift_id, SUM(total_refund) as total_refunded
                    FROM returns
                    GROUP BY shift_id
                  ) r ON sh.id = r.shift_id
                  WHERE 1 = 1";

        if ($status) {
            $query .= " AND sh.status = :status";
        }
        if ($branchId) {
            $query .= " AND sh.branch_id = :bid";
        }
        if ($start && $end) {
            $query .= " AND sh.start_time BETWEEN :start_date AND :end_date";
        }

        $query .= " ORDER BY sh.start_time DESC";

        $stmt = $this->db->prepare($query);
        if ($status) {
            $stmt->bindParam(':status', $status);
        }
        if ($branchId) {
            $stmt->bindParam(':bid', $branchId);
        }
        if ($start && $end) {
            $stmt->bindParam(':start_date', $start);
            $stmt->bindParam(':end_date', $end);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getShiftReport($shiftId) {
        $shifts = $this->getShifts(null, null, null, null);
        $shift = null;

        foreach ($shifts as $row) {
            if ((int)$row['id'] === (int)$shiftId) {
                $shift = $row;
                break;
            }
        }

        if (!$shift) {
            return null;
        }

        $salesQuery = "SELECT
                        s.transaction_id,
                        s.customer_name,
                        s.payment_method,
                        s.subtotal,
                        s.tax_amount,
                        s.discount_amount,
                        s.total,
                        s.status,
                        s.created_at,
                        COALESCE(SUM(si.quantity), 0) as item_count
                       FROM sales s
                       LEFT JOIN sale_items si ON s.id = si.sale_id
                       WHERE s.shift_id = :sid
                       GROUP BY s.id
                       ORDER BY s.created_at ASC";
        $stmt = $this->db->prepare($salesQuery);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $returnsQuery = "SELECT
                            r.id,
                            r.total_refund,
                            r.created_at,
                            s.transaction_id
                         FROM returns r
                         JOIN sales s ON r.sale_id = s.id
                         WHERE r.shift_id = :sid
                         ORDER BY r.created_at ASC";
        $stmt = $this->db->prepare($returnsQuery);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();
        $returns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            "shift" => $shift,
            "transactions" => $transactions,
            "returns" => $returns
        ];
    }
}
?>
