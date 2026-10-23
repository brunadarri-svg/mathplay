<?php
$configuracao = [
    'host' => '__DB_HOST__',
    'name' => '__DB_NAME__',
    'user' => '__DB_USER__',
    'password' => '__DB_PASS__'
];

$arquivoLocal = __DIR__ . DIRECTORY_SEPARATOR . 'config.local.php';
if (!is_file($arquivoLocal)) {
    return $configuracao;
}

$configuracaoLocal = require $arquivoLocal;
if (!is_array($configuracaoLocal)) {
    throw new RuntimeException('config.local.php deve retornar um array.');
}

return array_replace($configuracao, $configuracaoLocal);
