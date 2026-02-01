<?php
include_once __DIR__ . '/api/config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT u.username, o.code, o.expires_at 
              FROM otp_codes o 
              JOIN users u ON o.user_id = u.id 
              ORDER BY o.created_at DESC LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    if($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "\n--- Latest OTP Code ---\n";
        echo "User: " . $row['username'] . "\n";
        echo "Code: " . $row['code'] . "\n";
        echo "Expires: " . $row['expires_at'] . "\n";
        echo "-----------------------\n";
    } else {
        echo "No OTP found.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
