const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const dateformat = require('dateformat');
const sendText = require('./sendText');

// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'credentials.json';

// This is a temp variable to keep track of where to update the google doc
var latestUpdate = 2;

module.exports = function (learning, phoneNumber) {

    // Load client secrets from a local file.
    fs.readFile('/Users/i868003/Google Drive/Projects/Coding Practice/learningText/Resources/client_secret.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), updateSpreadsheet);
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
     * Prints the names and majors of students in a sample spreadsheet:
     * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
     * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
     */
    function listMajors(auth) {
        const sheets = google.sheets({version: 'v4', auth});
        sheets.spreadsheets.values.get({
            spreadsheetId: '1BDKm5aaJ-BXJQL8a827RUT-oXhSZdhPIvYPizF8rYEo',
            range: 'Sheet1!A1',
        }, (err, {data}) => {
            if (err) return console.log('The API returned an error: ' + err);
            const rows = data.values;
            if (rows.length) {
            console.log('Name, Major:');
            // Print columns A and E, which correspond to indices 0 and 4.
            rows.map((row) => {
                console.log(`${row[0]}, ${row[4]}`);
            });
            } else {
            console.log('No data found.');
            }
        });
    }

    function updateSpreadsheet (auth, learnMessage) {
        const sheets = google.sheets({version: 'v4', auth});
        var now = new Date();
        var dateString = dateformat(now, 'mm/dd/yyyy');
        var timeString = dateformat(now, 'h:MM:ss TT');

        var values = [
        [
            learning,
            dateString,
            timeString,
            phoneNumber
        ],
        // Additional rows ...
        ];
        var data = [];
        data.push({
            range: 'A' + latestUpdate,
            values: values
        });
        // Additional ranges to update ...
        var body = {
            data: data,
            valueInputOption: 'RAW'
        };
        sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: '1BDKm5aaJ-BXJQL8a827RUT-oXhSZdhPIvYPizF8rYEo',
            resource: body
        }, function(err, result) {
            if(err) {
                // Handle error
                console.log(err);
            } else {
                console.log('%d cells updated.', result.totalUpdatedCells);
                latestUpdate = latestUpdate + 1;
                sendText(phoneNumber, "Good job capturing a learning! Don't forget tomorrow")

            }
        });
    } //End UpdateSpreadsheet (...)
};