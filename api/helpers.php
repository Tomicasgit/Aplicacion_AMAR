<?php

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function input(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) respond(['ok' => false, 'error' => 'Se esperaba un cuerpo JSON válido.'], 400);
    return $data;
}

function token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/Bearer\s+(\S+)/i', $header, $matches) ? $matches[1] : null;
}

function userFromToken(): array
{
    $value = token();
    if (!$value) respond(['ok' => false, 'error' => 'Falta el token de usuario.'], 401);
    $stmt = db()->prepare('SELECT id, email, name FROM users WHERE api_token = ?');
    $stmt->execute([$value]);
    $user = $stmt->fetch();
    if (!$user) respond(['ok' => false, 'error' => 'Token no válido.'], 401);
    return $user;
}

function deviceFromKey(): array
{
    $key = token();
    if (!$key) respond(['ok' => false, 'error' => 'Falta la clave del dispositivo.'], 401);
    $stmt = db()->prepare('SELECT id, user_id, name FROM devices WHERE device_key = ? AND active = 1');
    $stmt->execute([$key]);
    $device = $stmt->fetch();
    if (!$device) respond(['ok' => false, 'error' => 'Dispositivo no autorizado.'], 401);
    return $device;
}

function requireMethod(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) respond(['ok' => false, 'error' => 'Método no permitido.'], 405);
}
