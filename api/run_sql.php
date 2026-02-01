<?php
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

$files = ['../sql/update_phase15.sql', '../sql/update_phase15_pt2.sql'];

foreach ($files as $file) {
    echo "Executing $file... ";
    try {
        $sql = file_get_contents($file);
        if (!$sql) {
            echo "Failed to read file.\n";
            continue;
        }
        $db->exec($sql);
        echo "Success.\n";
    } catch (PDOException $e) {
        
        if (strpos($e->getMessage(), "Duplicate column") !== false || strpos($e->getMessage(), "already exists") !== false) {
             echo "Already applied (Skipped).\n";
        } else {
             echo "Error: " . $e->getMessage() . "\n";
        }
    }
}
?>
