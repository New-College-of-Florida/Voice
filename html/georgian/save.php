/** Based on https://stackoverflow.com/questions/15722765/saving-a-text-file-on-server-using-javascript
 * See also https://www.php.net/manual/en/reserved.variables.post.php:
 * - The comments in tool.js:writeSave() before `xhr.send(data)` explain that
 *   the content type is multipart/form-data, as required.
 * Note also browser version requirements to use FormData:
 * - https://developer.mozilla.org/en-US/docs/Web/API/FormData#browser_compatibility
 */
 
/**
Attempts to perform some level of input validation before writing the save data to a
save file.
*/
<?php
debug_to_console("[save.php]");

if (!empty($_POST['data'])) {
	$saveData = test_input($_POST['data']);
	$savePath = "data/syllables/" . htmlspecialchars($_POST['path']) . "_save.txt";
}

$saveFile = fopen($savePath, 'w');
if ($saveFile === false) {
   debug_to_console("opening '" . $saveFile . "' failed");
   exit;
}
fwrite($saveFile, $saveData);
debug_to_console("Wrote save file " . $saveFile);
fclose($saveFile);


function test_input($data) {
	$data = stripslashes($data);
	$data = htmlspecialchars($data);
	return $data;
}

function debug_to_console($data) {
    $output = $data;
    if (is_array($output))
        $output = implode(',', $output);

    echo "<script>console.log('PHP Debug: " . $output . "' );</script>";
}

?>
