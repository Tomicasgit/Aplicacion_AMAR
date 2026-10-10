<?php
declare(strict_types=1);

class JsonDatabase
{
    private static ?self $instance = null;
    private string $filePath;
    private array $data = [];
    private int $lastId = 0;

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct(?string $filePath = null)
    {
        $this->filePath = $filePath ?? __DIR__ . '/data/database.json';
        $this->load();
    }

    private function load(): void
    {
        if (file_exists($this->filePath)) {
            $content = file_get_contents($this->filePath);
            $decoded = json_decode($content, true);
            if (is_array($decoded)) {
                $this->data = $decoded;
                return;
            }
        }
        $this->data = [
            'users' => [],
            'devices' => [],
            'emergency_contacts' => [],
            'heart_readings' => [],
            'locations' => [],
            'alerts' => [],
            '_auto_increment' => [
                'users' => 0,
                'devices' => 0,
                'emergency_contacts' => 0,
                'heart_readings' => 0,
                'locations' => 0,
                'alerts' => 0,
            ]
        ];
        $this->save();
    }

    public function save(): void
    {
        $dir = dirname($this->filePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        file_put_contents($this->filePath, json_encode($this->data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function lastInsertId(): int|string
    {
        return $this->lastId;
    }

    public function prepare(string $sql): JsonStatement
    {
        return new JsonStatement($this, $sql);
    }

    public function nextId(string $table): int
    {
        if (!isset($this->data['_auto_increment'][$table])) {
            $this->data['_auto_increment'][$table] = 0;
        }
        $this->data['_auto_increment'][$table]++;
        $this->lastId = (int)$this->data['_auto_increment'][$table];
        return $this->lastId;
    }

    public function &getTable(string $table): array
    {
        if (!isset($this->data[$table])) {
            $this->data[$table] = [];
        }
        return $this->data[$table];
    }
}

class JsonStatement
{
    private JsonDatabase $db;
    private string $sql;
    private array $results = [];
    private int $cursor = 0;

    public function __construct(JsonDatabase $db, string $sql)
    {
        $this->db = $db;
        $this->sql = trim($sql);
    }

    public function execute(array $params = []): bool
    {
        $sql = $this->sql;
        $this->results = [];
        $this->cursor = 0;

        // 1. SELECT id FROM users WHERE email = ?
        // 2. SELECT id, name, email, password_hash FROM users WHERE email = ?
        if (preg_match('/SELECT .* FROM users WHERE email\s*=\s*\?/i', $sql)) {
            $email = mb_strtolower(trim((string)($params[0] ?? '')));
            $users = $this->db->getTable('users');
            foreach ($users as $u) {
                if (mb_strtolower(trim((string)($u['email'] ?? ''))) === $email) {
                    $this->results[] = $u;
                    break;
                }
            }
            return true;
        }

        // 3. SELECT id, email, name FROM users WHERE api_token = ?
        if (preg_match('/SELECT .* FROM users WHERE api_token\s*=\s*\?/i', $sql)) {
            $token = trim((string)($params[0] ?? ''));
            $users = $this->db->getTable('users');
            foreach ($users as $u) {
                if (($u['api_token'] ?? '') === $token) {
                    $this->results[] = [
                        'id' => $u['id'],
                        'email' => $u['email'],
                        'name' => $u['name'],
                    ];
                    break;
                }
            }
            return true;
        }

        // 4. INSERT INTO users (name, email, password_hash, api_token) VALUES (?, ?, ?, ?)
        if (preg_match('/INSERT INTO users/i', $sql)) {
            $id = $this->db->nextId('users');
            $user = [
                'id' => $id,
                'name' => (string)($params[0] ?? 'Paciente'),
                'email' => (string)($params[1] ?? ''),
                'password_hash' => (string)($params[2] ?? ''),
                'api_token' => $params[3] ?? null,
                'created_at' => date('Y-m-d H:i:s'),
            ];
            $this->db->getTable('users')[] = $user;
            $this->db->save();
            return true;
        }

        // 5. UPDATE users SET api_token = ? WHERE id = ?
        if (preg_match('/UPDATE users SET api_token\s*=\s*\?\s*WHERE id\s*=\s*\?/i', $sql)) {
            $token = (string)($params[0] ?? '');
            $id = (int)($params[1] ?? 0);
            $users = &$this->db->getTable('users');
            foreach ($users as &$u) {
                if ((int)$u['id'] === $id) {
                    $u['api_token'] = $token;
                    break;
                }
            }
            $this->db->save();
            return true;
        }

        // 6. SELECT id, user_id, name FROM devices WHERE device_key = ? AND active = 1
        if (preg_match('/SELECT .* FROM devices WHERE device_key\s*=\s*\?/i', $sql)) {
            $key = (string)($params[0] ?? '');
            $devices = $this->db->getTable('devices');
            foreach ($devices as $d) {
                if (($d['device_key'] ?? '') === $key && (!isset($d['active']) || (int)$d['active'] === 1)) {
                    $this->results[] = $d;
                    break;
                }
            }
            return true;
        }

        // 7. SELECT id, name, phone, relationship FROM emergency_contacts WHERE user_id = ? ORDER BY id DESC
        if (preg_match('/SELECT .* FROM emergency_contacts WHERE user_id\s*=\s*\?/i', $sql)) {
            $userId = (int)($params[0] ?? 0);
            $contacts = $this->db->getTable('emergency_contacts');
            $matched = [];
            foreach ($contacts as $c) {
                if ((int)($c['user_id'] ?? 0) === $userId) {
                    $matched[] = $c;
                }
            }
            usort($matched, fn($a, $b) => ($b['id'] ?? 0) <=> ($a['id'] ?? 0));
            $this->results = $matched;
            return true;
        }

        // 8. INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES (?, ?, ?, ?)
        if (preg_match('/INSERT INTO emergency_contacts/i', $sql)) {
            $id = $this->db->nextId('emergency_contacts');
            $contact = [
                'id' => $id,
                'user_id' => (int)($params[0] ?? 0),
                'name' => (string)($params[1] ?? ''),
                'phone' => (string)($params[2] ?? ''),
                'relationship' => (string)($params[3] ?? ''),
                'created_at' => date('Y-m-d H:i:s'),
            ];
            $this->db->getTable('emergency_contacts')[] = $contact;
            $this->db->save();
            return true;
        }

        // 9. SELECT id, name, status, last_seen_at, created_at FROM devices WHERE user_id = ? ORDER BY id DESC
        if (preg_match('/SELECT .* FROM devices WHERE user_id\s*=\s*\?.*ORDER BY id DESC/i', $sql)) {
            $userId = (int)($params[0] ?? 0);
            $devices = $this->db->getTable('devices');
            $matched = [];
            foreach ($devices as $d) {
                if ((int)($d['user_id'] ?? 0) === $userId) {
                    $matched[] = $d;
                }
            }
            usort($matched, fn($a, $b) => ($b['id'] ?? 0) <=> ($a['id'] ?? 0));
            if (stripos($sql, 'LIMIT 1') !== false) {
                $matched = array_slice($matched, 0, 1);
            }
            $this->results = $matched;
            return true;
        }

        // 10. INSERT INTO devices (user_id, name, device_key) VALUES (?, ?, ?)
        if (preg_match('/INSERT INTO devices/i', $sql)) {
            $id = $this->db->nextId('devices');
            $device = [
                'id' => $id,
                'user_id' => (int)($params[0] ?? 0),
                'name' => (string)($params[1] ?? 'ESP32'),
                'device_key' => (string)($params[2] ?? ''),
                'status' => 'offline',
                'active' => 1,
                'last_seen_at' => null,
                'created_at' => date('Y-m-d H:i:s'),
            ];
            $this->db->getTable('devices')[] = $device;
            $this->db->save();
            return true;
        }

        // 11. SELECT bpm, recorded_at FROM heart_readings WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1
        if (preg_match('/SELECT .* FROM heart_readings WHERE user_id\s*=\s*\?/i', $sql)) {
            $userId = (int)($params[0] ?? 0);
            $readings = $this->db->getTable('heart_readings');
            $matched = [];
            foreach ($readings as $r) {
                if ((int)($r['user_id'] ?? 0) === $userId) {
                    $matched[] = $r;
                }
            }
            usort($matched, fn($a, $b) => strcmp($b['recorded_at'] ?? '', $a['recorded_at'] ?? ''));
            if (stripos($sql, 'LIMIT 1') !== false) {
                $matched = array_slice($matched, 0, 1);
            }
            $this->results = $matched;
            return true;
        }

        // 12. SELECT id, type, message, status, created_at FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
        if (preg_match('/SELECT .* FROM alerts WHERE user_id\s*=\s*\?/i', $sql)) {
            $userId = (int)($params[0] ?? 0);
            $alerts = $this->db->getTable('alerts');
            $matched = [];
            foreach ($alerts as $a) {
                if ((int)($a['user_id'] ?? 0) === $userId) {
                    $matched[] = $a;
                }
            }
            usort($matched, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
            if (stripos($sql, 'LIMIT 1') !== false) {
                $matched = array_slice($matched, 0, 1);
            }
            $this->results = $matched;
            return true;
        }

        // 13. SELECT latitude, longitude, recorded_at FROM locations WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1
        if (preg_match('/SELECT .* FROM locations WHERE user_id\s*=\s*\?/i', $sql)) {
            $userId = (int)($params[0] ?? 0);
            $locations = $this->db->getTable('locations');
            $matched = [];
            foreach ($locations as $l) {
                if ((int)($l['user_id'] ?? 0) === $userId) {
                    $matched[] = $l;
                }
            }
            usort($matched, fn($a, $b) => strcmp($b['recorded_at'] ?? '', $a['recorded_at'] ?? ''));
            if (stripos($sql, 'LIMIT 1') !== false) {
                $matched = array_slice($matched, 0, 1);
            }
            $this->results = $matched;
            return true;
        }

        // 14. SELECT COUNT(*) FROM emergency_contacts WHERE user_id = ?
        if (preg_match('/SELECT COUNT\(\*\) FROM emergency_contacts WHERE user_id\s*=\s*\?/i', $sql)) {
            $userId = (int)($params[0] ?? 0);
            $contacts = $this->db->getTable('emergency_contacts');
            $count = 0;
            foreach ($contacts as $c) {
                if ((int)($c['user_id'] ?? 0) === $userId) $count++;
            }
            $this->results = [['COUNT(*)' => $count]];
            return true;
        }

        // 15. INSERT INTO heart_readings (user_id, device_id, bpm) VALUES (?, ?, ?)
        if (preg_match('/INSERT INTO heart_readings/i', $sql)) {
            $id = $this->db->nextId('heart_readings');
            $this->db->getTable('heart_readings')[] = [
                'id' => $id,
                'user_id' => (int)($params[0] ?? 0),
                'device_id' => (int)($params[1] ?? 0),
                'bpm' => (int)($params[2] ?? 0),
                'recorded_at' => date('Y-m-d H:i:s'),
            ];
            $this->db->save();
            return true;
        }

        // 16. INSERT INTO locations (user_id, device_id, latitude, longitude) VALUES (?, ?, ?, ?)
        if (preg_match('/INSERT INTO locations/i', $sql)) {
            $id = $this->db->nextId('locations');
            $this->db->getTable('locations')[] = [
                'id' => $id,
                'user_id' => (int)($params[0] ?? 0),
                'device_id' => (int)($params[1] ?? 0),
                'latitude' => (float)($params[2] ?? 0),
                'longitude' => (float)($params[3] ?? 0),
                'recorded_at' => date('Y-m-d H:i:s'),
            ];
            $this->db->save();
            return true;
        }

        // 17. UPDATE devices SET status = ?, last_seen_at = NOW() WHERE id = ?
        if (preg_match('/UPDATE devices SET status\s*=\s*\?.*WHERE id\s*=\s*\?/i', $sql)) {
            $status = (string)($params[0] ?? 'offline');
            $deviceId = (int)($params[1] ?? 0);
            $devices = &$this->db->getTable('devices');
            foreach ($devices as &$d) {
                if ((int)$d['id'] === $deviceId) {
                    $d['status'] = $status;
                    $d['last_seen_at'] = date('Y-m-d H:i:s');
                    break;
                }
            }
            $this->db->save();
            return true;
        }

        // 18. INSERT INTO alerts (user_id, device_id, type, message) VALUES (?, ?, ?, ?)
        if (preg_match('/INSERT INTO alerts/i', $sql)) {
            $id = $this->db->nextId('alerts');
            $this->db->getTable('alerts')[] = [
                'id' => $id,
                'user_id' => (int)($params[0] ?? 0),
                'device_id' => (int)($params[1] ?? 0),
                'type' => (string)($params[2] ?? 'panic'),
                'message' => (string)($params[3] ?? ''),
                'status' => 'open',
                'created_at' => date('Y-m-d H:i:s'),
            ];
            $this->db->save();
            return true;
        }

        return true;
    }

    public function fetch(): array|false
    {
        if (isset($this->results[$this->cursor])) {
            return $this->results[$this->cursor++];
        }
        return false;
    }

    public function fetchAll(): array
    {
        $all = array_slice($this->results, $this->cursor);
        $this->cursor = count($this->results);
        return $all;
    }

    public function fetchColumn(int $column = 0): mixed
    {
        $row = $this->fetch();
        if ($row === false) return false;
        $values = array_values($row);
        return $values[$column] ?? false;
    }
}
