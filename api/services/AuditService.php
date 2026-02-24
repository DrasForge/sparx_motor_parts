<?php
class AuditService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function logActivity($userId, $action, $details) {
        $query = "INSERT INTO audit_logs (user_id, action, details, created_at) 
                  VALUES (:uid, :act, :det, NOW())";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':uid', $userId);
        $stmt->bindParam(':act', $action);
        $stmt->bindParam(':det', $details);
        $stmt->execute();
    }

    public function getLogs($limit = 100) {
        $query = "SELECT l.*, u.username FROM audit_logs l 
                  JOIN users u ON l.user_id = u.id 
                  ORDER BY l.created_at DESC LIMIT :limit";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
