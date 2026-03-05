<?php
$lines = file('c:/xampp/apache/logs/error.log');
$last = array_slice($lines, -30);
echo implode("", $last);
?>
