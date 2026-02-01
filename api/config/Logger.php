<?php
class Logger {
    
    public static function log($db, $userId, $action, $details = null) {
        try {
            
            $ip = $_SERVER['REMOTE_ADDR'];
            if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
                $ip = $_SERVER['HTTP_CLIENT_IP'];
            } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
                $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
            }

            $query = "INSERT INTO audit_logs (user_id, action, details, ip_address, created_at) VALUES (:uid, :action, :details, :ip, NOW())";
            $stmt = $db->prepare($query);

            
            
            
            
            

            $stmt->bindParam(':uid', $userId);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':details', $details);
            $stmt->bindParam(':ip', $ip);

            $stmt->execute();
        } catch (Exception $e) {
            
            error_log("Audit Log Error: " . $e->getMessage());
        }
    }
}
?>
