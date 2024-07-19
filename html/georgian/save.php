// Based on https://stackoverflow.com/questions/15722765/saving-a-text-file-on-server-using-javascript

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
