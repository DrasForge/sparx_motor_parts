<?php
$db = new PDO('mysql:host=localhost;dbname=gpos_db', 'root', '');
$res = $db->query("DESCRIBE sales")->fetchAll(PDO::FETCH_ASSOC);
file_put_contents('api/sales_schema.json', json_encode($res, JSON_PRETTY_PRINT));
$res2 = $db->query("SELECT id, transaction_id, status FROM sales WHERE id IN (18, 19)")->fetchAll(PDO::FETCH_ASSOC);
file_put_contents('api/sales_18_19.json', json_encode($res2, JSON_PRETTY_PRINT));
?>
