<?php
declare(strict_types=1);
require __DIR__ . '/database.php';
require __DIR__ . '/helpers.php';

header('Access-Control-Allow-Origin: *'); // Para desarrollo local. Restringir al dominio real antes de publicar.
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$action = $_GET['action'] ?? '';

try {
    if ($action === 'register') {
        requireMethod('POST'); $data = input();
        $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $password = $data['password'] ?? ''; $name = trim($data['name'] ?? 'Paciente');
        if (!$email || strlen($password) < 6) respond(['ok' => false, 'error' => 'Correo válido y contraseña de 6 caracteres como mínimo requeridos.'], 422);
        $pdo = db(); $check = $pdo->prepare('SELECT id FROM users WHERE email = ?'); $check->execute([$email]);
        if ($check->fetch()) respond(['ok' => false, 'error' => 'Ese correo ya está registrado.'], 409);
        $token = bin2hex(random_bytes(32));
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash, api_token) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $token]);
        respond(['ok' => true, 'token' => $token, 'user' => ['id' => $pdo->lastInsertId(), 'name' => $name, 'email' => $email]], 201);
    }

    if ($action === 'login') {
        requireMethod('POST'); $data = input();
        $stmt = db()->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
        $stmt->execute([trim($data['email'] ?? '')]); $user = $stmt->fetch();
        if (!$user || !password_verify($data['password'] ?? '', $user['password_hash'])) respond(['ok' => false, 'error' => 'Correo o contraseña incorrectos.'], 401);
        $token = bin2hex(random_bytes(32)); db()->prepare('UPDATE users SET api_token = ? WHERE id = ?')->execute([$token, $user['id']]);
        respond(['ok' => true, 'token' => $token, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]]);
    }

    if ($action === 'contacts') {
        $user = userFromToken();
        if ($_SERVER['REQUEST_METHOD'] === 'GET') { $stmt = db()->prepare('SELECT id, name, phone, relationship FROM emergency_contacts WHERE user_id = ? ORDER BY id DESC'); $stmt->execute([$user['id']]); respond(['ok' => true, 'contacts' => $stmt->fetchAll()]); }
        requireMethod('POST'); $data = input();
        if (!trim($data['name'] ?? '') || !trim($data['phone'] ?? '')) respond(['ok' => false, 'error' => 'Nombre y teléfono son obligatorios.'], 422);
        db()->prepare('INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES (?, ?, ?, ?)')->execute([$user['id'], trim($data['name']), trim($data['phone']), trim($data['relationship'] ?? '')]);
        respond(['ok' => true, 'id' => db()->lastInsertId()], 201);
    }

    if ($action === 'devices') {
        $user = userFromToken();
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $stmt = db()->prepare('SELECT id, name, status, last_seen_at, created_at FROM devices WHERE user_id = ? ORDER BY id DESC');
            $stmt->execute([$user['id']]); respond(['ok' => true, 'devices' => $stmt->fetchAll()]);
        }
        requireMethod('POST'); $data = input(); $name = trim($data['name'] ?? 'ESP32');
        if ($name === '' || strlen($name) > 100) respond(['ok' => false, 'error' => 'El nombre del dispositivo no es válido.'], 422);
        $key = bin2hex(random_bytes(32));
        db()->prepare('INSERT INTO devices (user_id, name, device_key) VALUES (?, ?, ?)')->execute([$user['id'], $name, $key]);
        respond(['ok' => true, 'device' => ['id' => db()->lastInsertId(), 'name' => $name, 'device_key' => $key]], 201);
    }

    if ($action === 'dashboard') {
        requireMethod('GET'); $user = userFromToken(); $pdo = db();
        $reading = $pdo->prepare('SELECT bpm, recorded_at FROM heart_readings WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1'); $reading->execute([$user['id']]);
        $device = $pdo->prepare('SELECT id, name, status, last_seen_at FROM devices WHERE user_id = ? ORDER BY id DESC LIMIT 1'); $device->execute([$user['id']]);
        $alert = $pdo->prepare('SELECT id, type, message, status, created_at FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'); $alert->execute([$user['id']]);
        $location = $pdo->prepare('SELECT latitude, longitude, recorded_at FROM locations WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1'); $location->execute([$user['id']]);
        $count = $pdo->prepare('SELECT COUNT(*) FROM emergency_contacts WHERE user_id = ?'); $count->execute([$user['id']]);
        respond(['ok' => true, 'patient' => $user, 'last_reading' => $reading->fetch() ?: null, 'device' => $device->fetch() ?: null, 'last_alert' => $alert->fetch() ?: null, 'last_location' => $location->fetch() ?: null, 'contacts_count' => (int)$count->fetchColumn()]);
    }

    // Estos tres endpoints se usan desde el ESP32. El header debe ser: Authorization: Bearer CLAVE_DEL_DISPOSITIVO
    if ($action === 'reading') {
        requireMethod('POST'); $device = deviceFromKey(); $data = input(); $bpm = filter_var($data['bpm'] ?? null, FILTER_VALIDATE_INT);
        if ($bpm === false || $bpm < 20 || $bpm > 260) respond(['ok' => false, 'error' => 'La frecuencia debe estar entre 20 y 260 BPM.'], 422);
        db()->prepare('INSERT INTO heart_readings (user_id, device_id, bpm) VALUES (?, ?, ?)')->execute([$device['user_id'], $device['id'], $bpm]); respond(['ok' => true], 201);
    }
    if ($action === 'location') {
        requireMethod('POST'); $device = deviceFromKey(); $data = input(); $lat = $data['latitude'] ?? null; $lng = $data['longitude'] ?? null;
        if (!is_numeric($lat) || !is_numeric($lng) || $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) respond(['ok' => false, 'error' => 'Coordenadas inválidas.'], 422);
        db()->prepare('INSERT INTO locations (user_id, device_id, latitude, longitude) VALUES (?, ?, ?, ?)')->execute([$device['user_id'], $device['id'], $lat, $lng]); respond(['ok' => true], 201);
    }
    if ($action === 'device-status') {
        requireMethod('POST'); $device = deviceFromKey(); $data = input(); $status = $data['status'] ?? '';
        if (!in_array($status, ['online', 'offline', 'alert'], true)) respond(['ok' => false, 'error' => 'Estado inválido.'], 422);
        db()->prepare('UPDATE devices SET status = ?, last_seen_at = NOW() WHERE id = ?')->execute([$status, $device['id']]); respond(['ok' => true]);
    }
    if ($action === 'alert') {
        requireMethod('POST'); $device = deviceFromKey(); $data = input(); $type = $data['type'] ?? 'panic';
        if (!in_array($type, ['panic', 'high_heart_rate', 'device'], true)) respond(['ok' => false, 'error' => 'Tipo de alerta inválido.'], 422);
        $message = trim($data['message'] ?? 'Alerta generada por el dispositivo.');
        db()->prepare('INSERT INTO alerts (user_id, device_id, type, message) VALUES (?, ?, ?, ?)')->execute([$device['user_id'], $device['id'], $type, $message]); respond(['ok' => true, 'alert_id' => db()->lastInsertId()], 201);
    }
    respond(['ok' => false, 'error' => 'Endpoint inexistente.'], 404);
} catch (Throwable $exception) {
    error_log($exception->getMessage()); respond(['ok' => false, 'error' => 'Error del servidor: ' . $exception->getMessage()], 500);
}

