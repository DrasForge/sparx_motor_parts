<?php
include_once 'api/config/database.php';

$database = new Database();
$db = $database->getConnection();

$sql = "ALTER TABLE users ADD COLUMN full_name VARCHAR(255) AFTER username";

try {
    $db->exec($sql);
    echo "full_name column added successfully.\n";
    
    // Update existing users to have a default full name based on username
    $db->exec("UPDATE users SET full_name = username WHERE full_name IS NULL OR full_name = ''");
    echo "Existing users updated.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
