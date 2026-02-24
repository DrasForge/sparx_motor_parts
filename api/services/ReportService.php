<?php
class ReportService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getTransactions($branch_id, $start, $end) {
        $query = "SELECT s.*, b.name as branch_name, u.username as cashier_name 
                  FROM sales s 
                  JOIN branches b ON s.branch_id = b.id 
                  JOIN users u ON s.cashier_id = u.id 
                  WHERE s.created_at BETWEEN :start AND :end";
        if ($branch_id) {
            $query .= " AND s.branch_id = :bid";
        }
        $query .= " ORDER BY s.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':start', $start);
        $stmt->bindParam(':end', $end);
        if ($branch_id) {
            $stmt->bindParam(':bid', $branch_id);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getDashboardStats($branch_id) {
        $stats = [];
        $today = date('Y-m-d');
        
        $salesQuery = "SELECT SUM(total) as sales_today, COUNT(*) as orders_today FROM sales 
                       WHERE status = 'completed' AND DATE(created_at) = :today";
        if ($branch_id) $salesQuery .= " AND branch_id = :bid";
        $stmt = $this->db->prepare($salesQuery);
        $stmt->bindParam(':today', $today);
        if ($branch_id) $stmt->bindParam(':bid', $branch_id);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        $stockQuery = "SELECT COUNT(*) as low_stock FROM products p 
                       JOIN inventory i ON p.id = i.product_id 
                       WHERE i.quantity < 10";
        if ($branch_id) $stockQuery .= " AND i.branch_id = :bid";
        $stmt = $this->db->prepare($stockQuery);
        if ($branch_id) $stmt->bindParam(':bid', $branch_id);
        $stmt->execute();
        $stats['low_stock'] = $stmt->fetch(PDO::FETCH_ASSOC)['low_stock'];

        $recentQuery = "SELECT * FROM sales WHERE status = 'completed'";
        if ($branch_id) $recentQuery .= " AND branch_id = :bid";
        $recentQuery .= " ORDER BY created_at DESC LIMIT 5";
        $stmt = $this->db->prepare($recentQuery);
        if ($branch_id) $stmt->bindParam(':bid', $branch_id);
        $stmt->execute();
        $stats['recent_sales'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }

    public function getBranchPerformance() {
        $query = "SELECT b.id, b.name, 
                  IFNULL(SUM(s.total), 0) as total_sales,
                  COUNT(s.id) as transaction_count,
                  IFNULL(SUM(si.quantity), 0) as items_sold,
                  (SELECT COUNT(*) FROM inventory i WHERE i.branch_id = b.id AND i.quantity < 10) as low_stock
                  FROM branches b
                  LEFT JOIN sales s ON b.id = s.branch_id AND DATE(s.created_at) = CURDATE()
                  LEFT JOIN sale_items si ON s.id = si.sale_id
                  GROUP BY b.id";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSalesChart($days, $branch_id = null) {
        $query = "SELECT DATE(created_at) as date, SUM(total) as total 
                  FROM sales 
                  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY) 
                  AND status = 'completed'";
        if ($branch_id) $query .= " AND branch_id = :bid";
        $query .= " GROUP BY DATE(created_at) ORDER BY date ASC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':days', $days, PDO::PARAM_INT);
        if ($branch_id) $stmt->bindParam(':bid', $branch_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTopProducts($branch_id = null) {
        $query = "SELECT p.name, p.sku, SUM(si.quantity) as sold_qty, SUM(si.subtotal) as revenue
                  FROM sale_items si
                  JOIN products p ON si.product_id = p.id
                  JOIN sales s ON si.sale_id = s.id
                  WHERE s.status = 'completed' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        if ($branch_id) $query .= " AND s.branch_id = :bid";
        $query .= " GROUP BY p.id ORDER BY sold_qty DESC LIMIT 10";
        
        $stmt = $this->db->prepare($query);
        if ($branch_id) $stmt->bindParam(':bid', $branch_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAuditLogs() {
        $query = "SELECT a.*, u.username 
                  FROM audit_logs a 
                  LEFT JOIN users u ON a.user_id = u.id 
                  ORDER BY a.created_at DESC LIMIT 100";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
