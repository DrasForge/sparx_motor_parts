<?php
include_once __DIR__ . '/api/config/database.php';

$database = new Database();
$db = $database->getConnection();

$username = 'admin';
$password = 'admin123';
$hash = password_hash($password, PASSWORD_BCRYPT);

try {
    $query = "UPDATE users SET password_hash = :hash WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':hash', $hash);
    $stmt->bindParam(':username', $username);
    
    if($stmt->execute()) {
        echo "Password for '$username' reset successfully to '$password'.\n";
    } else {
        echo "Failed to reset password.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
