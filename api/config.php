<?php
// Copiá estos valores según tu instalación local. No subas credenciales reales al repositorio.
return [
    'db_host' => getenv('AMAR_DB_HOST') ?: '127.0.0.1',
    'db_name' => getenv('AMAR_DB_NAME') ?: 'amar',
    'db_user' => getenv('AMAR_DB_USER') ?: 'root',
    'db_pass' => getenv('AMAR_DB_PASS') ?: '',
];
