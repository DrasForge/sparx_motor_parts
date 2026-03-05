<?php
$db = new PDO('mysql:host=localhost;dbname=gpos_db', 'root', '');
$res = $db->query('DESCRIBE sale_items')->fetchAll(PDO::FETCH_ASSOC);
file_put_contents('api/check_out.json', json_encode($res, JSON_PRETTY_PRINT));
?>
