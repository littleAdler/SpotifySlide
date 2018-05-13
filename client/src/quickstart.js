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

setInterval(function(){authorize(JSON.parse(content),updateSlidePosition)},10000);
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

function listSlides(auth) {
    //console.log(auth);
    const slides = google.slides({version: 'v1', auth});
    //console.log(slides);
    slides.presentations.get({
        presentationId: '14oeVyzsEVfbxteuGnHS8MYz7p0CgqeUxKyN-F6fDfOI',
    }, (err, {data}) => {
        if (err) return console.log('The API returned an error: ' + err);
    const length = data.slides.length;
    console.log('The presentation contains %s slides:', length);
    //console.log(data);
    data.slides.map((slide, i) => {
        console.log(`- Slide #${i + 1} contains ${slide.pageElements.length} elements.`);
});
});
}

function updateSlidePosition(auth) {

    //****NOTE: MAKE SURE you delete the credentials.json every once in a while to get a new access token if it expires

    const slides = google.slides({version: 'v1', auth});

    slides.presentations.batchUpdate({
        presentationId: '14oeVyzsEVfbxteuGnHS8MYz7p0CgqeUxKyN-F6fDfOI',
        "access_token": 'ya29.Glu6BQgGG4k0CNyFP-LmuUQzXXxkbc5KQrIaUXQsmzWtlZ5mZqosm3zUe2PVHH-RgLoZS3yAPLUad1KN394EPjuIYZM4iCLB2qMAC7xvAI3ZFoztVwY3gsr7ziOX',
        "resource": {
            "requests": [
                {
                    "updateSlidesPosition": {
                        "slideObjectIds": [
                            "p"
                        ],
                        "insertionIndex": 0
                    }
                }
            ]
        }
    });
}
