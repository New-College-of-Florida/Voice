/** Based on https://stackoverflow.com/questions/15722765/saving-a-text-file-on-server-using-javascript
 * See also https://www.php.net/manual/en/reserved.variables.post.php:
 * - The comments in tool.js:writeSave() before `xhr.send(data)` explain that
 *   the content type is multipart/form-data, as required.
 */
 
/**
Attempts to perform some level of input validation before writing the save data to a
save file.
*/
<?php
if (!empty($_POST['data'])) {
	$saveData = test_input($_POST['data']);
	$savePath = "data/syllables/" . htmlspecialchars($_POST['path']) . "_save.txt";
}

function test_input($data) {
	$data = stripslashes($data);
	$data = htmlspecialchars($data);
	return $data;
}

$saveFile = fopen($savePath, 'w');
fwrite($saveFile, $saveData);
fclose($saveFile);
?>
