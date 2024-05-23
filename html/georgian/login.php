<?php
session_start();
ob_start();
if($_POST) {
	if($_POST['password'] == "georgian2021ncf") {
		$_SESSION['georgian_login'] = TRUE;
		header("Location: index.php");
	} else {
		$error = "Wrong password. Please try again.";
	}
}
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="icon" href="/docs/4.0/assets/img/favicons/favicon.ico">

    <title>Teach Yourself Georgian Dataset: A Corpus Of Traditional A Cappella Vocal Polyphony</title>

    <link rel="canonical" href="https://getbootstrap.com/docs/4.0/examples/cover/">

    <!-- Bootstrap core CSS -->
    <link href="dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <link href="dist/css/cover.css" rel="stylesheet">
  </head>

  <body class="text-center body-short">

    <div class="cover-container d-flex h-100 p-3 mx-auto flex-column">
      <header class="masthead mb-auto">
        <div class="inner">
          <h3 class="masthead-brand">Teach Yourself Georgian Dataset</h3>
          <nav class="nav nav-masthead justify-content-center">
            <a class="nav-link active" href="index.php">Home</a>
            <a class="nav-link" href="paper.php">Paper</a>
            <a class="nav-link" href="tool.php">Tool</a>
          </nav>
        </div>
      </header>

      <main role="main" class="inner cover">
        <h1 class="cover-heading">Login required for access</h1>
        <p class="lead"><?php echo $error; ?></p>
        <form action="login.php" method="POST" class="form-group">
        	<label>Password:</label> <input type="text" name="password" class="form-control" />
        	<input type="submit" value="Login" class="form-control" style="margin-top:15px" />
    	</form>
      </main>

      <footer class="mastfoot mt-auto">
        <div class="inner">
          <p></p>
        </div>
      </footer>
    </div>


    <!-- Bootstrap core JavaScript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
    <script>window.jQuery || document.write('<script src="/assets/js/vendor/jquery-slim.min.js"><\/script>')</script>
    <script src="assets/js/vendor/popper.min.js"></script>
    <script src="dist/js/bootstrap.min.js"></script>
  </body>
</html>
<?php ob_end_flush(); ?>
