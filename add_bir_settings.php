<?php
require_once 'api/config/database.php';
$db = (new Database())->getConnection();

$settings = [
    ['company_name', 'SPARX MOTOR PARTS'],
    ['company_address', '123 Main St, Manila, Philippines'],
    ['company_tin', '000-000-000-000'],
    ['receipt_footer', 'THIS SERVES AS YOUR OFFICIAL RECEIPT. THANK YOU FOR YOUR PATRONAGE!'],
    ['machine_sn', 'SN123456789'],
    ['permit_no', 'PERMIT-2024-001']
];

foreach ($settings as $setting) {
    try {
        $checkStmt = $db->prepare("SELECT COUNT(*) FROM settings WHERE setting_key = ?");
        $checkStmt->execute([$setting[0]]);
        if ($checkStmt->fetchColumn() == 0) {
            $insertStmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
            $insertStmt->execute($setting);
            echo "Added setting: {$setting[0]}\n";
        } else {
            echo "Setting already exists: {$setting[0]}\n";
        }
    } catch (Exception $e) {
        echo "Error adding setting {$setting[0]}: " . $e->getMessage() . "\n";
    }
}
?>
