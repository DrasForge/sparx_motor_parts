<?php
include_once __DIR__ . '/api/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "PHP Date: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Timezone: " . date_default_timezone_get() . "\n";

try {
    $stmt = $db->query("SELECT NOW() as db_time, @@global.time_zone as global_tz, @@session.time_zone as session_tz");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "MySQL Time: " . $row['db_time'] . "\n";
    echo "MySQL Global TZ: " . $row['global_tz'] . "\n";
    echo "MySQL Session TZ: " . $row['session_tz'] . "\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
