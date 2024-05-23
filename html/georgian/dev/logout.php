<?php
session_start();
ob_start();
$_SESSION['georgian_login'] = FALSE;
header("Location:index.php")
?>