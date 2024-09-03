<?php
require_once __DIR__.'/vendor/autoload.php';
include_once "templates/base.php";

session_start();

/******************************/
/* Oauth2 user authentication */
/******************************/

/* Refers to steps here:
 * https://github.com/googleapis/google-api-php-client/blob/main/docs/oauth-web.md
 */

/* get oauth credentials */
if (!$oauth_credentials = getOAuthCredentialsFile()) {
    echo missingOAuth2CredentialsWarning();
    return;
}

/* step 1: set Oauth2 parameters */
$client = new Google\Client();
$client->setAuthConfig($oauth_credentials);
$home_uri = 'https://' . $_SERVER['HTTP_HOST']; 
$client->setRedirectUri($home_uri . '/oauth2callback.php');
$scopes = array("https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
                "openid");
$client->addScope($scopes);

if (! isset($_GET['code'])) {
  /* step 2: request token from Google Oauth2 server */
  /* step 4: Google response does not contain a code, try step 2 again */
  $auth_url = $client->createAuthUrl();
  header('Location: ' . filter_var($auth_url, FILTER_SANITIZE_URL));
  /* step 3: Google prompts user, returns code*/
}
else {
  /* step 5: Exchange code for access token (!!and optional refresh token -- figure this out) */
  $client->authenticate($_GET['code']);
  $_SESSION['access_token'] = $client->getAccessToken();
  header('Location: ' . filter_var($home_uri, FILTER_SANITIZE_URL));
}

?>
