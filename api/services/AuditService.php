<?php
class AuditService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function log($userId, $action, $details = null) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $query = "INSERT INTO audit_logs (user_id, action, details, ip_address) 
                  VALUES (:uid, :action, :details, :ip)";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':details', $details);
        $stmt->bindParam(':ip', $ip);
        
        return $stmt->execute();
    }
}
?>
