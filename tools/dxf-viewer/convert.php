<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'message' => 'Nur POST ist erlaubt.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_FILES['cadFile'])) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'message' => 'Kein Upload empfangen (cadFile fehlt).'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(501);
echo json_encode([
    'ok' => false,
    'message' => 'DWG/andere Formate brauchen serverseitige Konvertierung nach DXF. Implementiere hier z.B. ODA File Converter und gib {"dxfText":"..."} zuruck.'
], JSON_UNESCAPED_UNICODE);
