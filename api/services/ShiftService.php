<?php
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
        return $this->db->lastInsertId();
    }

    public function endShift($shiftId, $endingCash) {
        $stats = $this->getShiftStats($shiftId);
        $expected = $stats['expected_cash'];
        $difference = $endingCash - $expected;

        $query = "UPDATE shifts SET ending_cash = :ecash, status = 'closed', end_time = NOW() WHERE id = :sid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':ecash', $endingCash);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();

        return [
            "shift_id" => $shiftId,
            "total_sales" => $stats['total_sales'],
            "txn_count" => $stats['txn_count'],
            "ending_cash" => $endingCash,
            "difference" => $difference
        ];
    }

    public function getShiftStats($shiftId) {
        $query = "SELECT starting_cash FROM shifts WHERE id = :sid";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();
        $start = $stmt->fetch(PDO::FETCH_ASSOC)['starting_cash'] ?? 0;

        $salesQuery = "SELECT SUM(total) as cash_sales, COUNT(*) as txn_count FROM sales 
                       WHERE shift_id = :sid AND payment_method = 'cash' AND status = 'completed'";
        $stmt = $this->db->prepare($salesQuery);
        $stmt->bindParam(':sid', $shiftId);
        $stmt->execute();
        $sales = $stmt->fetch(PDO::FETCH_ASSOC);

        $cashSales = $sales['cash_sales'] ?? 0;
        return [
            "starting_cash" => $start,
            "cash_sales" => $cashSales,
            "expected_cash" => $start + $cashSales,
            "total_sales" => $cashSales, 
            "txn_count" => $sales['txn_count'] ?? 0
        ];
    }
}
?>
