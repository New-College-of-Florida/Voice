<?php
//ob_start();
require_once __DIR__.'/vendor/autoload.php';

session_start();

/* No need to set Oauth2 parameters and instantiate client here,
 * because we are only using the access_token to confirm authentication
 * 
 * If this is a dev site we aren't using the access token at all.
 */
$home_uri = 'https://' . $_SERVER['HTTP_HOST'];
$dev_site = (substr($_SERVER['HTTP_HOST'], -30, 30) != 'teachyourselfgeorgiansongs.org');
if ($dev_site) {
    $_SESSION['access_token'] = 'dev site: no access token needed';
}

/* delegate Oauth2 user authentication*/
if (!(isset($_SESSION['access_token']) && $_SESSION['access_token'])) {
  header('Location: ' . filter_var($home_uri  . '/oauth2callback.php', FILTER_SANITIZE_URL));
}
?>

<!DOCTYPE html>
<html>
    <head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
	<meta name="description" content="">
	<meta name="author" content="">

	<link rel="icon" href="favicon.png" type="image/png"/>
        <title>Teach Yourself Georgian Songs</title>
	<link rel="canonical" href="https://www.teachyourselfgeorgiansongs.org">

	<!-- Bootstrap core CSS -->
	<link href="dist/css/bootstrap.min.css" rel="stylesheet">

	<!-- Custom styles for this template -->
	<link href="styles/georgian.css" rel="stylesheet">
	
	<!--<script src='https://cdn.plot.ly/plotly-2.4.2.min.js'></script>-->
	<script type="text/javascript" src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    </head>
    <body>
        <header class="masthead">
          <div class="inner">
            <nav class="nav nav-masthead justify-content-center">
              <a class="nav-link active" href="index.php">Home</a>
              <a class="nav-link" href="info.php">Info</a>
              <a class="nav-link" href="contact.php">Contact</a>
            </nav>
          </div>
	<div id="title" class="title">
	    Teach Yourself <img src="assets/img/blue chonguri.png" alt="Chonguri" class="icon"/> Georgian Songs
	</div>
        </header>
	<div id="sidebar" class="sidebar">
            <div class="form-group">
              <label>Region </label>
              <select id="collectionName" class="form-control">
                <option value=''></option>
                <option value='Teach Yourself Gurian Songs'>Guria</option>
                <option value='Teach Yourself Megrelian Songs'>Samegrelo</option>
              </select>
            </div>
            <div id="songNameRow" class="form-group">
              <label>Song </label>
              <select id="songName" class="form-control">
              </select>
            </div>
            <div id="voiceNameRow" class="form-group">
              <label>Voice </label>
              <select id="voiceName" class="form-control">
                <option value=''></option>
                <option value='mixed'>Mixed</option>
                <option value='bass'>Bass</option>
                <option value='mid'>Mid</option>
                <option value='top'>Top</option>                
              </select>
            </div>
            <div id="uploadLyricsRow" class="form-group">
	      <label id="uploadLyricsLabel", for="uploadLyrics"> Upload Lyrics </label>
	      <select id="uploadLyrics" class="form-control" disabled=true>
	      </select>
	    </div>
	    <div id="uploadLyricsFormRow" class="form-group">
		<form id="uploadLyricsForm">
		    <input type="hidden" name="hidden_form_input_id" value="123456" readonly="true">
		    <input type="hidden" name="MAX_FILE_SIZE" value="30000" />
		    <input type="file" name="lyricsFile" id="selectedLyricsFile" style="display: none;" 
			   onchange="document.getElementsByTagName('p')[0].innerHTML=this.value;" />
		    <input type="button" value="Browse" onclick="document.getElementById('selectedLyricsFile').click();" />
		    <p>no file chosen</p>
		    <!--<input name="lyricsFile" type="file" /><br />-->
		    <input type="submit" value="Upload">
		</form>
	    </div>
	</div>
	<div id="main" class="main">
	  <div id="plot-container">
            <audio id="audioPlayer"
                controls
                src="">
                    Your browser does not support the
                    <code>audio</code> element.
            </audio>
            <div id="main_plot" class="card-body d-flex align-items-center justify-content-center"></div>
	    <div id="button-container">
		<button class="plot_button" id="merge_word_left_button" onclick = "onButtonMergeAnnotation('left')" type="button">Merge Word Back</button>
		<button class="plot_button" id="merge_word_right_button" onclick = "onButtonMergeAnnotation('right')" type="button">Merge Word Forward</button>
	    </div>
            <div id="mad_plot" class="card-body d-flex align-items-center justify-content-center"></div>
	  </div>
	</div> 
	


      <!-- Bootstrap core JavaScript
	 ================================================== -->
      <!-- Placed at the end of the document so the pages load faster -->

      <script src="https://code.jquery.com/jquery-3.2.1.min.js"></script>
      <script src="assets/js/vendor/popper.min.js"></script>
      <script src="dist/js/bootstrap.min.js"></script>
      <script src="utils.js?v=1"></script>
      <script src="tool.js?v=1"></script>
    </body>
</html>

<?php
//ob_end_flush();
?>
