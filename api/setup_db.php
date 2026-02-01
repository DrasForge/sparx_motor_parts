<?php
$host = "localhost";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected to MySQL successfully.\n";

    $sql = file_get_contents(__DIR__ . '/../database/schema.sql');
    
    
    
    
    
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, 1);
    
    $conn->exec($sql);
    echo "Database and Tables created successfully.\n";

} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>
