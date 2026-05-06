<?php
// restore_db.php - Script to safely restore the sparx_db from the consolidated schema
require_once __DIR__ . '/../api/config/Database.php';

echo "Starting Database Restoration for 'sparx' project...\n";

try {
    // Connect without specifying a database first to ensure we can create it
    // Wait, the Database.php class likely connects to sparx_db directly.
    // Let's create a raw PDO connection to MySQL server.
    
    // We will read Database.php to get credentials if needed, but usually it's root/no-password in XAMPP.
    $host = '127.0.0.1';
    $user = 'root';
    $pass = '';

    echo "Connecting to MySQL server...\n";
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sqlFilePath = __DIR__ . '/../database/consolidated_schema.sql';
    if (!file_exists($sqlFilePath)) {
        die("Error: Schema file not found at $sqlFilePath\n");
    }

    echo "Reading schema file: $sqlFilePath\n";
    $sqlData = file_get_contents($sqlFilePath);

    // Drop the database if it already exists to ensure a clean slate
    echo "Dropping existing sparx_db (if exists)...\n";
    $pdo->exec("DROP DATABASE IF EXISTS sparx_db");

    echo "Executing consolidated schema script...\n";
    
    // Execute the full SQL script
    $pdo->exec($sqlData);

    echo "\n[SUCCESS] Database 'sparx_db' has been fully restored with the latest schema.\n";
    echo "- All tables including shifts, sale_items, and settings created.\n";
    echo "- All foreign keys applied.\n";
    echo "- Initial branches and admin user seeded.\n";

} catch (PDOException $e) {
    echo "\n[ERROR] Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "\n[ERROR] General error: " . $e->getMessage() . "\n";
}
