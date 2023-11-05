<?php include("login-check.php"); ?>
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
    <!--<script src='https://cdn.plot.ly/plotly-2.4.2.min.js'></script>-->
	<script type="text/javascript" src="https://cdn.plot.ly/plotly-latest.min.js"></script>


  </head>

  <body class="text-center body-long">

    <div class="cover-container d-flex h-100 p-3 mx-auto flex-column">
        <header class="masthead mb-auto">
          <div class="inner">
            <h3 class="masthead-brand">Teach Yourself Georgian Dataset</h3>
            <nav class="nav nav-masthead justify-content-center">
              <a class="nav-link" href="index.php">Home</a>
              <a class="nav-link" href="paper.php">Paper</a>
              <a class="nav-link active" href="tool.php">Tool</a>
            </nav>
          </div>
        </header>
      <main role="main" class="inner cover" style="margin-top:50px;">
        <h1 class="cover-heading">Song Visualizations</h1>
            <div class="form-group">
              <label>Pick a collection: </label>
              <select id="collectionName" class="form-control">
                <option value=''></option>
                <option value='Teach Yourself Gurian Songs'>Teach Yourself Gurian Songs</option>
                <option value='Teach Yourself Megrelian Songs'>Teach Yourself Megrelian Songs</option>
              </select>
            </div>
            <div id="songNameRow" class="form-group">
              <label>Pick a song: </label>
              <select id="songName" class="form-control">
              </select>
            </div>
            <div id="voiceNameRow" class="form-group">
              <label>Pick a voice: </label>
              <select id="voiceName" class="form-control">
                <option value=''></option>
                <option value='mixed'>Mixed</option>
                <option value='bass'>Bass</option>
                <option value='mid'>Mid</option>
                <option value='top'>Top</option>
                
              </select>
            </div>
            <audio id="audioPlayer"
                controls
                src="">
                    Your browser does not support the
                    <code>audio</code> element.
            </audio>
           <div id="plot" style="width:900px; height:500px; margin-left:-120px"></div>
<!--            <div id="plot2" style="width:500; height:500px; margin-left:-150px"></div> -->
            <button id="delete_button" onclick = "on_button_delete()" type="button">Delete Selected</button>
            <button id="move_words_button" onclick = "on_button_move_over()" type="button">Move Words</button>

            <div id="plot2" style="margin-top: 10px; width:500; height:500px; display: flex; justify-content: center"></div>

        <p class="lead" style="margin-top:30px">
          <a href="paper.php" class="btn btn-lg btn-secondary">Learn more</a>
        </p>
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

    <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
    <script src="assets/js/vendor/popper.min.js"></script>
    <script src="dist/js/bootstrap.min.js"></script>
    <script src="tool.js?v=1"></script>
  </body>
</html>
