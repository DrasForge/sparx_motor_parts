<?php
$db = new PDO('mysql:host=localhost;dbname=gpos_db', 'root', '');
$stmt = $db->query("SELECT id, transaction_id, status FROM sales WHERE transaction_id='TRX-BAB5EE45-1772718560'");
$sale = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt2 = $db->query("SELECT * FROM returns");
$returns = $stmt2->fetchAll(PDO::FETCH_ASSOC);

$res = ['sale' => $sale, 'returns' => $returns];
file_put_contents('api/dump_sale_json.json', json_encode($res, JSON_PRETTY_PRINT));
?>
