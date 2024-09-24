/**
Saves the time-blocks file.
Time blocks are from the notes files, which we have generated. No need to validate the data.
*/
<?php
debug_to_console("[save_time_blocks.php]");

$saveFile = fopen($_POST['path'], 'w');
if ($saveFile === false) {
   debug_to_console("opening '" . $saveFile . "' failed");
   exit;
}
fwrite($saveFile, $_POST['data']);
debug_to_console("Wrote save file " . $saveFile);
fclose($saveFile);

function debug_to_console($data) {
    $output = $data;
    if (is_array($output))
        $output = implode(',', $output);

    echo "<script>console.log('PHP Debug: " . $output . "' );</script>";
}

?>
