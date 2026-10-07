<?php
declare(strict_types=1);

require_once __DIR__ . '/JsonDatabase.php';

function db(): PDO|JsonDatabase
{
    static $dbInstance = null;
    if ($dbInstance !== null) {
        return $dbInstance;
    }

    $config = require __DIR__ . '/config.php';

    // Intentamos conectar a MySQL primero
    try {
        $host = $config['db_host'] ?? '127.0.0.1';
        $port = $config['db_port'] ?? 3306;
        $dbName = $config['db_name'] ?? 'amar';
        $user = $config['db_user'] ?? 'root';
        $pass = $config['db_pass'] ?? '';

        $dsnWithoutDb = "mysql:host={$host};port={$port};charset=utf8mb4";
        $pdo = new PDO($dsnWithoutDb, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 2,
        ]);

        // Crear base de datos si no existe
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$dbName}`");

        // Verificar si las tablas existen
        $tables = $pdo->query("SHOW TABLES LIKE 'users'")->fetchAll();
        if (empty($tables)) {
            $sqlFile = dirname(__DIR__) . '/database.sql';
            if (file_exists($sqlFile)) {
                $sqlContent = file_get_contents($sqlFile);
                $pdo->exec($sqlContent);
            }
        }

        $dbInstance = $pdo;
        return $dbInstance;
    } catch (Throwable $e) {
        // Si MySQL no está disponible, usamos automáticamente JsonDatabase
        // para que el proyecto funcione de inmediato sin configuraciones complejas.
        $dbInstance = JsonDatabase::getInstance();
        return $dbInstance;
    }
}
