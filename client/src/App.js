import React, { Component } from 'react';

import './App.css';
import { Button } from 'reactstrap';

import SpotifyWebApi from 'spotify-web-api-js';
const spotifyApi = new SpotifyWebApi();


class App extends Component {

  constructor(){
    super();
    const params = this.getHashParams();
    const token = params.access_token;

    console.log("access token: " + token);
    if (token) {
      spotifyApi.setAccessToken(token);
    }
    this.state = {
      loggedIn: token ? true : false,

      playlistParams:[],
      songName: "",
      artAlbum:'',

      playlistTracks:[],
      playlistComparisonData:[],

      //NOTE: track names are done implicitly in the comp data, see 'getTrackData' function
      playID: '',
      playName: '',
      playNames: [],
      playIDs: [],

      slide:''


    }
  }

  //Used for retrieving and storing 'access' and 'refresh' tokens (located in uri)
  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    e = r.exec(q)
    while (e) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
       e = r.exec(q);
    }
    return hashParams;
  }


  //UPDATES THE CURRENT PLAYBACK SONG NAME AND ALBUM ART
  getNowPlaying(){

            spotifyApi.getMyCurrentPlaybackState().then((response) => {

                this.state.songName = response.item.name.toString();
                this.state.artAlbum = response.item.album.images[0].url;

                //Send data to the corresponding html divisions
                document.getElementById("songName").innerHTML = "\""+this.state.songName+"\"";
                document.getElementById("image").src = this.state.artAlbum;

               // console.log(this.state.songName);
                //console.log(this.state.artAlbum);

            });

  }

  //GETS PLAYLIST 'NAMEs' AND 'IDs' TO STORE IN THE 'STATE' OBJECT AS ARRAYS
  getPlaylistData(){

      spotifyApi.getUserPlaylists()

          .then((res) => {

              this.state.playlistParams = res.items;


              //Store playlist NAMEs and output to console
              let playNames = [];
              this.state.playlistParams.forEach(function(element){
                 playNames.push(element.name);
              });
              this.playNames = playNames;
              //console.log('Playlist Names: ' + this.playNames);

              //Store playlist IDs and output to console
              let playIDs = [];
              this.state.playlistParams.forEach(function(element){
                  playIDs.push(element.id);
              });
              this.state.playIDs = playIDs;
             // console.log('Playlist IDs: ' + this.state.playIDs);


              //CHECK A SPECIFIC PLAYLIST NAME OR ID:
              /*
              this.playID = this.state.playlistParams[0].id;
              this.playName=this.state.playlistParams[0].name;
              console.log('Playlist Name: ' + this.playName);
              console.log('Playlist ID: ' + this.playID);
              return this.playID;
              */

          })
  }

  //GETS THE TRACK NAMES FROM PLAYLIST'S AND COMBINE THEM WITH THE CORRESPONDING PLAYLIST NAME IN 'playlistComparisonData'
  //NOTE: each playlist and its tracks are stored in 1 dimension of a 2 dimensional array, where the first element is the
        //playlist name, followed by the tracks in the playlist. So it stands to reason that each dimensions size is the 'playlist's length+1'

  getTrackData() {

     //console.log("playlist ID: " + this.state.playIDs[0]);
     //console.log("user ID: " + "mspouge");
      let compData = [];
      for(let i=0; i<3 ; i++) {
          spotifyApi.getPlaylistTracks("mspouge", this.state.playIDs[i])

              .then((response) => {

                  this.state.playlistTracks = response.items;
                  //console.log(this.state.playlistTracks.length) //number of songs in the selected playlist
                  //console.log(this.state.playlistTracks) //all of the track data for each song in the selected playlist

                  let trackNames = [];

                  for (let i = 0; i < this.state.playlistTracks.length; i++) {
                      trackNames.push(this.state.playlistTracks[i].track.name)
                      //console.log(this.state.playlistTracks[i].track.name);
                  }

                  compData[i]=[this.playNames[i],this.state.playlistTracks.length, trackNames]; //compData has the first element as the playlist name and the rest are the track names
                  this.state.playlistComparisonData = compData; //store info globally in the state object
                  //console.log("Comparison Data: " + this.state.playlistComparisonData);

              });

      }

      //console.log("Comparison Data: " + compData);

  }

  //CHECK THE FORMAT OF THE 'playlistComparisonData' ARRAY
  checkCompData(){
      console.log("Comparison Data [1]: " + this.state.playlistComparisonData[0]);
      console.log("Comparison Data [2]: " + this.state.playlistComparisonData[1]);
      console.log("Comparison Data [3]: " + this.state.playlistComparisonData[2]);
  }

  displaySlide(){
      let slide ='';
      //console.log("OUTPUT: .........................");
      //console.log("Currently Playing: " + this.state.songName);

      for(let j=0; j<3 ; j++) {
          //console.log("PLAYLIST SONGS: ");
          for (let i = 0; i < this.state.playlistComparisonData[j][1]; i++) {

              //console.log(this.state.playlistComparisonData[j][2][i])
              //console.log("Current Playing:"+this.state.songName)
              if(this.state.playlistComparisonData[j][2][i]===this.state.songName){
                  slide=this.state.playlistComparisonData[j][0]; //contains playlist name
                  this.state.slide=slide;
                  //console.log("Slide: "+slide);
                  break;
              }else{
                  slide='¯\\_(ツ)_/¯';
              }
          }
          if(slide!=='' && slide!=='¯\\_(ツ)_/¯'){
              break;
          }
      }
      document.getElementById("slide").innerHTML = "Slide: " + slide;
  }

  automate() {
      this.interval = setInterval(() => this.getNowPlaying(),1000);
      this.interval = setInterval(() => this.getPlaylistData(),2000);
      this.interval = setInterval(() => this.getTrackData(),3000);
      this.interval = setInterval(() => this.displaySlide(),4000);
     // this.interval = setInterval(() => this.quickstart(),8000);



      //console.log(document.getElementsByClassName("goog-menuitem goog-option goog-option-selected"));
      //this.displaySlide();
  }


      /*
      this.getPlaylistData();
      console.log();
      this.getTrackData(this.state.playIDs);
      //this.checkCompData();
      this.displaySlide(); */


  //TODO: Automate the slide display process
  //TODO: Change track display automatically by looking at the song duration or when the skip button is pressed

/* OLD RENDER CODE:

{ this.state.loggedIn &&
          <button onClick={() => this.getNowPlaying()}>
            Check Now Playing
          </button>
          }

          { this.state.loggedIn &&
          <button onClick={() => this.getPlaylistData()}>
              Check Playlist Data
          </button>
          }

          { this.state.loggedIn &&
          <button onClick={() => this.getTrackData()}>
              Check Tracks in Playlist
          </button>
          }

          { this.state.loggedIn &&
          <button onClick={() => this.checkCompData()}>
              Check Comparison Data
          </button>
          }

          { this.state.loggedIn &&
          <button onClick={() => this.displaySlide()}>
              Display Slide
          </button>
          }


 */



  render() {

    return (


      <div className="App">
          <img id="gif"src="https://i.imgur.com/8YsAmq3.gif"></img>
          {!this.state.loggedIn &&
              <Button outline color="success" href='http://localhost:8888'>Login to Spotify </Button>
          }
          <div id="songName">
              <font id= "songName" face="impact"></font>
          </div>


          <img id="image" style={{ height: 150 }}></img>



          <div id="slide">
              <font id="slide" face="impact"></font>
          </div>

          <div className="exe-container">

          </div>
          {this.state.loggedIn &&
          <Button outline color="primary" id="automate" onClick={() => this.automate()}>
              Automate
          </Button>
          }

          {this.state.loggedIn &&
          <iframe id="slideshow" src="https://docs.google.com/presentation/d/e/2PACX-1vSt947_Jgp7hkxZaAOPz9z3Rtba6QBoBlZ9lucta01sYdWvxAkCXN9lH_epZMQPneLLP3OsvmgBR1qQ/embed?start=false&loop=false&delayms=3000" frameborder="0" width="1000" height="590" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
          }

      </div>

    );
  }


}

export default App;
