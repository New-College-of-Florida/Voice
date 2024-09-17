<?php
header("content-type: text/html; charset=UTF-8");

// allowable characters and transcription
$englishChars = str_split("abcdefghijklmnopqrstuvwxyz'- \n");
$georgianChars = str_split("აბგდევზთიკლმნოპჟრსტუფქღყშჩცძშჭხჯჰ \n"); //!! should go up to e183bf
$language = "";

// move uploaded file to temporary location 
$syllablesDir = __DIR__ . "/georgian/data/syllables/" .  $_POST['collectionName'] . "/" . $_POST['songName'] . "/";
$uploadsDir = __DIR__ . "/uploads/" . $_POST['collectionName'] . "/" . $_POST['songName'] . "/";
$tempFile = $uploadsDir . $_POST['voiceExtension'] . "_syllables_temp.txt";
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}
move_uploaded_file( $_FILES["lyricsFile"]["tmp_name"], $tempFile)
    or exit("Failure: The server couldn't move the file.\n");
($_FILES["lyricsFile"]["size"] >= 25)
    or exit("Failure: The file must be between 25 and 30,000 bytes.\n");
(($contents = file_get_contents($tempFile)) !== false)
    or exit("Failure: The server couldn't read the file.\n");

// check file contents
$contents = str_replace("\r", "", $contents);
$emptystr = str_replace($englishChars, "", $contents);
if (!strlen($emptystr)) {
    $language = "en";
} else {
    if (substr($contents, 0, 3) == "\xef\xbb\xbf") { // this 3-byte "BOM" indicates the file is utf-8
        $contents = substr($contents, 3);
    }
    $emptystr = str_replace($georgianChars, "", $contents);
    if (!strlen($emptystr)) {
        $language = "ge";
    } else {
        exit("Failure: The file contained non-English and non-Georgian characters: " . $emptystr . "\n");
    }
}

// move file
$targetFile = $syllablesDir . $_POST['voiceExtension'] . "_syllables_" . $language . ".txt";

(file_put_contents($targetFile, $contents) !== false)
    or exit("Failure: The server couldn't write the file.");

echo "Success! " . $_POST['voiceName'] . " lyrics file saved\nPlease wait a day or two for the lyrics and audio to be aligned.\n";
?>
