<?php
class AuthService {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function login($username, $password) {
        $query = "SELECT * FROM users WHERE username = :username LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            return $user;
        }
        return false;
    }

    public function verifySession($user_id) {
        $query = "SELECT * FROM users WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $user_id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function generateOTP($username) {
        $otp = sprintf("%06d", mt_rand(0, 999999));
        $expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));
        
        $query = "UPDATE users SET otp_code = :otp, otp_expiry = :expiry WHERE username = :username";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':otp', $otp);
        $stmt->bindParam(':expiry', $expiry);
        $stmt->bindParam(':username', $username);
        $stmt->execute();
        
        return $otp; 
    }

    public function verifyOTP($username, $otp) {
        $query = "SELECT * FROM users WHERE username = :username AND otp_code = :otp AND otp_expiry > NOW() LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':otp', $otp);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function generateToken($user) {
        return bin2hex(random_bytes(32));
    }
}
?>
