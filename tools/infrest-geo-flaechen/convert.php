<?php
declare(strict_types=1);

function respond_json_error(string $message, int $statusCode = 400): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function slugify_filename(string $name): string
{
    $name = pathinfo($name, PATHINFO_FILENAME);
    $name = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) ?: $name;
    $name = strtolower((string) preg_replace('/[^a-zA-Z0-9]+/', '-', $name));
    $name = trim($name, '-');
    return $name !== '' ? $name : 'konvertiert';
}

function remove_directory(string $directory): void
{
    if (!is_dir($directory)) {
        return;
    }

    $items = scandir($directory);
    if ($items === false) {
        return;
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $path = $directory . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) {
            remove_directory($path);
            continue;
        }

        @unlink($path);
    }

    @rmdir($directory);
}

function runtime_temp_root(): string
{
    $suffix = 'default';
    if (function_exists('posix_geteuid')) {
        $suffix = (string) posix_geteuid();
    }

    return '/tmp/infrest-geo-flaechen-' . $suffix;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_json_error('Nur POST ist erlaubt.', 405);
}

if (!isset($_FILES['kml']) || !is_array($_FILES['kml'])) {
    respond_json_error('Es wurde keine KML-Datei hochgeladen.');
}

$upload = $_FILES['kml'];
if (($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    respond_json_error('Der Upload ist fehlgeschlagen.');
}

$originalName = (string) ($upload['name'] ?? 'datei.kml');
$extension = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
if ($extension !== 'kml') {
    respond_json_error('Bitte nur `.kml` hochladen.');
}

$temporaryRoot = runtime_temp_root();
if (!is_dir($temporaryRoot) && !mkdir($temporaryRoot, 0775, true) && !is_dir($temporaryRoot)) {
    respond_json_error('Das temporäre Verzeichnis konnte nicht angelegt werden.', 500);
}

$requestDirectory = $temporaryRoot . '/request-' . bin2hex(random_bytes(8));
$outputDirectory = $requestDirectory . '/output';
if (!mkdir($requestDirectory, 0775, true) && !is_dir($requestDirectory)) {
    respond_json_error('Das Arbeitsverzeichnis konnte nicht angelegt werden.', 500);
}

register_shutdown_function(static function () use ($requestDirectory): void {
    remove_directory($requestDirectory);
});

$inputPath = $requestDirectory . '/' . basename($originalName);
if (!move_uploaded_file((string) $upload['tmp_name'], $inputPath)) {
    respond_json_error('Die hochgeladene Datei konnte nicht verarbeitet werden.', 500);
}

if (!mkdir($outputDirectory, 0775, true) && !is_dir($outputDirectory)) {
    respond_json_error('Das Ausgabe-Verzeichnis konnte nicht angelegt werden.', 500);
}

$baseName = slugify_filename($originalName);
$command = sprintf(
    '%s %s --input %s --output-dir %s --base-name %s',
    escapeshellarg(__DIR__ . '/bin/run_qgis_python.sh'),
    escapeshellarg(__DIR__ . '/bin/convert_kml.py'),
    escapeshellarg($inputPath),
    escapeshellarg($outputDirectory),
    escapeshellarg($baseName)
);

$descriptorSpec = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$process = proc_open($command, $descriptorSpec, $pipes, __DIR__);
if (!is_resource($process)) {
    respond_json_error('Der Konverter konnte nicht gestartet werden.', 500);
}

fclose($pipes[0]);
$stdout = stream_get_contents($pipes[1]) ?: '';
$stderr = stream_get_contents($pipes[2]) ?: '';
fclose($pipes[1]);
fclose($pipes[2]);

$exitCode = proc_close($process);
if ($exitCode !== 0) {
    respond_json_error(trim($stderr) !== '' ? trim($stderr) : 'Die KML konnte nicht konvertiert werden.', 500);
}

$manifest = json_decode($stdout, true);
if (!is_array($manifest) || !isset($manifest['parts']) || !is_array($manifest['parts'])) {
    respond_json_error('Die Konverter-Antwort war ungültig.', 500);
}

$parts = $manifest['parts'];
$partCount = count($parts);
if ($partCount === 0) {
    respond_json_error('Es wurde keine GeoJSON-Ausgabe erzeugt.', 500);
}

header('X-Geojson-Part-Count: ' . $partCount);
header('X-Source-Area-M2: ' . (($manifest['source_area_m2'] ?? 0)));
header('X-Source-Perimeter-M: ' . (($manifest['source_perimeter_m'] ?? 0)));

if ($partCount === 1) {
    $filePath = (string) ($parts[0]['path'] ?? '');
    $fileName = (string) ($parts[0]['filename'] ?? ($baseName . '.geojson'));
    if (!is_file($filePath)) {
        respond_json_error('Die erzeugte GeoJSON-Datei fehlt.', 500);
    }

    header('Content-Type: application/geo+json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . rawurlencode($fileName) . '"');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

$zipPath = $requestDirectory . '/' . $baseName . '.zip';
$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    respond_json_error('Die ZIP-Datei konnte nicht erzeugt werden.', 500);
}

foreach ($parts as $part) {
    $filePath = (string) ($part['path'] ?? '');
    $fileName = (string) ($part['filename'] ?? '');
    if ($filePath === '' || $fileName === '' || !is_file($filePath)) {
        $zip->close();
        respond_json_error('Eine erzeugte GeoJSON-Datei fehlt.', 500);
    }

    $zip->addFile($filePath, $fileName);
}

$zip->close();

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . rawurlencode($baseName . '.zip') . '"');
header('Content-Length: ' . filesize($zipPath));
readfile($zipPath);
exit;
