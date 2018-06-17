/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var opn = require('opn');

var client_id = 'ad7be720f9d0444ab71f9d24793993fd'; // Your client id
var client_secret = '51a4b23bc03f4af68cbd834eb97bf191'; // Your secret
var redirect_uri = 'http://localhost:8888/callback/'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-currently-playing user-read-playback-state playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;


        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          //console.log(body);
        });

        var options2 = {
          url: 'https://api.spotify.com/v1/me/player/currently-playing',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };
        //TRYING SHIT


        function callbackConsole(param){
          console.log("Callback Returned: "+ param);
        }

        function requestSongName(){
          let song_name='';
          request.get(options2,function(err,res,body){
            console.log("Currently Playing: "+ body.item.name);
            song_name = body.item.name;

            request.get(playlistReq,function(err,res,body){
              //console.log("RES: "+ JSON.parse(body).items[0].name);
              let playlistArr = [''];
              response = JSON.parse(body);
              for(let i =0; i<3;i++){
                playlistArr[i]=response.items[i].name;
                var tracksReq={
                  url: response.items[i].tracks.href,
                  headers:{
                    'Authorization':'Bearer '+ access_token
                  }
                }
                for(let j=0; j<response.items[i].tracks.total;j++){
                  request.get(tracksReq,function(err,res,body){
                    if(JSON.parse(body).items[j].track.name===song_name){
                      console.log("Current Playlist: " + playlistArr[i]);
                      ///Call the Slides API in here (it will only run once b/c it only matches once)
                      callSlidesAPI(playlistArr[i]);
                    }
                  });
                }
              }



              //console.log("PLAYLISTS: "+playlistArr);
            });

          });
          //return song_name;
          //return song;


        }

        setInterval(requestSongName,5000);

        var playlistReq={
          url: 'https://api.spotify.com/v1/me/playlists',
          headers:{
            'Authorization':'Bearer '+ access_token
          }
        }







        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});


//---------------------------SLIDES CODE----------------------------------
//callSlidesAPI("Update Test");
function callSlidesAPI(spotifyPlaylist){
  console.log("SLIDES")
  const fs = require('fs');
  const readline = require('readline');
  const {google} = require('googleapis');

  // If modifying these scopes, delete credentials.json.
  const SCOPES = ['https://www.googleapis.com/auth/presentations'];
  const TOKEN_PATH = 'credentials.json';

  // Load client secrets from a local file.
  fs.readFile('client_secret.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Slides API.
    authorize(JSON.parse(content), updateSlidePosition);
  });

  /**
  * Create an OAuth2 client with the given credentials, and then execute the
  * given callback function.
  * @param {Object} credentials The authorization client credentials.
  * @param {function} callback The callback to call with the authorized client.
  */
  function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }

    /**
    * Get and store new token after prompting for user authorization, and then
    * execute the given callback with the authorized OAuth2 client.
    * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
    * @param {getEventsCallback} callback The callback for the authorized client.
    */
    function getNewToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return callback(err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) console.error(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });
    }

    /**
    * Prints the number of slides and elements in a sample presentation:
    * https://docs.google.com/presentation/d/1EAYk18WDjIG-zp_0vLm3CsfQh_i8eXc67Jo2O9C6Vuc/edit
    * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
    */
    function updateSlidePosition(auth) {

    //****NOTE: MAKE SURE you delete the credentials.json every once in a while to get a new access token if it expires
    //window.addEventListener('load',console.log(document.getElementById("slide").innerHTML),false)


    const slides = google.slides({version: 'v1', auth});
    //let slideID=this.state.slide.toString();
    let slideID ='';
    //let sliden=slideName
    //let spotifyPlaylist="Update Test"
    //console.log(testSlide);
    //let testSlide='';
    if(spotifyPlaylist==='Update Test'){
        slideID = 'p';
    }else if(spotifyPlaylist==='Test 3'){
        slideID ='g5gevl';
    }else if(spotifyPlaylist ==="Test 2"){
        slideID = 'g39e58e82b0_0_135';
    }else if (spotifyPlaylist === "Test 1"){
        slideID = 'g5gevlh';
    }

    slides.presentations.batchUpdate({
        presentationId: '14oeVyzsEVfbxteuGnHS8MYz7p0CgqeUxKyN-F6fDfOI',
        "access_token": 'ya29.Glu6BQgGG4k0CNyFP-LmuUQzXXxkbc5KQrIaUXQsmzWtlZ5mZqosm3zUe2PVHH-RgLoZS3yAPLUad1KN394EPjuIYZM4iCLB2qMAC7xvAI3ZFoztVwY3gsr7ziOX',
        "resource": {
            "requests": [
                {
                    "updateSlidesPosition": {
                        "slideObjectIds": [
                            slideID
                        ],
                        "insertionIndex": 0
                    }
                }
            ]
        }
    });
}
}
console.log('Listening on 8888');

app.listen(8888);
opn('http://localhost:8888/');
