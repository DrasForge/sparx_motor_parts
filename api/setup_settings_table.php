<?php
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    
    $query = "CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $db->exec($query);
    echo "Settings table created.\n";

    
    $query = "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('tax_rate', '12')";
    $db->exec($query);
    echo "Default settings seeded.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
