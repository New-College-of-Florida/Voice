<?php
/* Finds list of voices for a song that need lyrics.
 * To be called asynchronously when the uploadLyrics selector is enabled.
 */
$voice = strtolower($_POST['voiceName']);
if ($voice == "bass") {
    $file_extensions = array("AHDS1M");
  } else if($voice == "mid"){
    $file_extensions = array("AHDS2M");
  } else if($voice == "top") {
    $file_extensions = array("AHDS3M");
  } else if($voice == "mixed") {
    $file_extensions = array("AHDS1M", "AHDS2M", "AHDS3M");
} else {
    $file_extensions = array();
}

$pathToSyllablesDir = __DIR__ . "/georgian/data/syllables/" .  $_POST['collectionName'] . "/" . $_POST['songName'] . "/";
if (!is_dir($pathToSyllablesDir)) {
    mkdir($pathToSyllablesDir, 0755, true);
    exit( json_encode($file_extensions) );
}

foreach(array_keys($file_extensions) as $key) {
    if (file_exists($pathToSyllablesDir . $file_extensions[$key] . "_syllables.txt")) {
        unset($file_extensions[$key]);
    } 
}
echo json_encode($file_extensions);
?>
