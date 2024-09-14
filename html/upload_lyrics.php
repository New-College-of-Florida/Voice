<?php
header("content-type: text/html; charset=UTF-8");
$englishChars = str_split("abcdefghijklmnopqrstuvwxyz'- \n");
$georgianChars = str_split(""); //!!
$fileToSave = $_POST['voiceExtension'] . "_syllables.txt";
$syllablesDir = __DIR__ . "/georgian/data/syllables/" .  $_POST['collectionName'] . "/" . $_POST['songName'] . "/";
$uploadsDir = __DIR__ . "/uploads/" . $_POST['collectionName'] . "/" . $_POST['songName'] . "/";
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}
$tempFile = $uploadsDir . $fileToSave;
move_uploaded_file( $_FILES["lyricsFile"]["tmp_name"], $tempFile)
    or exit("Failure: The server couldn't move the file.\n");
($_FILES["lyricsFile"]["size"] >= 25)
    or exit("Failure: The file must be between 25 and 30,000 bytes.\n");
(($contents = file_get_contents($tempFile)) !== false)
    or exit("Failure: The server couldn't read the file.\n");

$contents = str_replace("\r", "", $contents);
$emptystr = str_replace($englishChars, "", $contents);
(!strlen($emptystr))
    or exit("Failure: The file contained characters other than plain-text English lowercase letters, spaces, apostrophes, and new-lines.\n"); //!! add Georgian

$targetFile = $syllablesDir . $fileToSave;
(file_put_contents($targetFile, $contents) !== false)
    or exit("Failure: The server couldn't write the file.");

echo "Success! " . $_POST['voiceName'] . " lyrics file saved\nPlease wait a day or two for the lyrics and audio to be aligned.\n";
?>
