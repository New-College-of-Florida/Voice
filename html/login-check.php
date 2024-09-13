<?php
ob_start();
session_start();
if(!$_SESSION['georgian_login']) {
	header("Location:login.php");
}
ob_end_flush();