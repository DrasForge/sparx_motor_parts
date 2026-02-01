<?php

$url = 'http://localhost/sparx/api/auth/login.php';
$data = array('username' => 'admin', 'password' => 'admin123');

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true 
    )
);

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "--- HTTP Response Headers ---\n";
print_r($http_response_header);
echo "\n--- Raw Output Content ---\n";
var_dump($result);
?>
