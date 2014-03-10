/**
 * @desc        backbone router for pushState page routing
 */

define(
  [
    'app',
    'jquery',
    'underscore',
    'backbone',
    'socket',
    'bootstrap',
    
    'views/MainView',
    'views/YoutubeView',
    'views/GoogleView',
    'views/HeaderView',
    'views/SettingsView',
    'views/SearchBarView',
    'views/TwitterView',
    'views/FacebookView',

], function(app, $, _, Backbone, Socket, bootstrap, MainView, YoutubeView, GoogleView, HeaderView, SettingsView, SearchBarView,TwitterView,FacebookView){

    var WebRouter = Backbone.Router.extend({

      routes: {
        "":     "index"
      },

      initialize: function(options) {

        this.remoteSocket = io.connect('http://192.168.2.2:3000');
        this.screenSocket = io.connect('http://127.0.0.1:3000');
        this.isMobile = this.checkForMobile();
        var selector;
        var _this = this;
        
        if(this.isMobile){
          this.socket = this.remoteSocket;
          this.state = "mobile";
          this.remoteSocket.emit('remote');
        }
        else {
          this.socket = this.screenSocket;
          this.state = "tv";
          this.socket.on('connect', function(data){
            _this.socket.emit('screen');
          });



        }

        //Socket listeners for the screen
        //may move these to their respective views

        //takes the selection data
        this.socket.on('controlling', function(data){
           _this.onRenderSelection(data);
        });

        //handles which search bar to render
        this.socket.on('controlling-data', function(data){
          $('#searchBar').val(data);
        });

        //handles recieving youtube player commands
        this.socket.on('youtube-control', function(data){
        });


        this.socket.on('twitter-login', function(data){
          console.log("login!");
          alert("Please log in with the settings page");
        });
        this.socket.on('facebook-login', function(data){
          console.log("login!");
          alert("Please log in with the settings page");
        });
        this.socket.on('log-out-facebook', function(data){


          $('.fb-feed').html('<div id="facebook-list"><div id="fb_feed"></div></div>');


        });

        this.socket.on('log-out-twitter', function(data){
 
          $('.tw-feed').html('<ul class="list-group" id="twitter-list"></ul>');

        });







        this.views = [];
        this.$body = $("body");
        this.$header = $("header");


        this.settingsView = new SettingsView({socket: this.remoteSocket});
        this.settingsView.on('refresh',this.refresh,this);
        this.settingsView.$el.hide();
        this.$body.prepend(this.settingsView.render().$el);
        this.views.push(this.settingsView);


        this.mainView = new MainView({socket: this.socket, mobile: this.isMobile });
        this.mainView.on('renderSelection',this.onRenderSelection,this);
        this.views.push(this.mainView);





        this.$body.prepend(this.mainView.render(this.state).$el);

        if(!this.isMobile){
          this.$twitter = $('.tw-feed');
          this.twitterView = new TwitterView({socket: this.socket});
          this.twitterView.$el.show();
          this.$twitter.append(this.twitterView.render().$el);

          this.$facebook = $('.fb-feed');
          this.facebookView = new FacebookView({socket: this.socket});
          this.facebookView.$el.show();
          this.$facebook.append(this.facebookView.render().$el);


        }


        this.socket.on('ss-log-in-facebook', function(data){

           window.location = "/auth/facebook";


        });



        $('#searchBar').bind('input', function(e) {
            var searchBarData = $('#searchBar').val();
            _this.sendSearchBoxData(searchBarData);
        });
      },

      sendSearchBoxData: function(data) {
        this.remoteSocket.emit('send-data',{key: data});
      },

      refresh: function() {
        this.remoteSocket.emit("refresh", "test");
      },

      onRenderSelection: function(chosenSelection) {

        //only render views on mobile
        if(this.isMobile){

            this.searchBarView = new SearchBarView({socket: this.socket});
            this.searchBarView.on('onCloseSearchBar',this.closeSearchBar,this);
            this.searchBarView.on('onSearchSubmit',this.submitSearchBar,this);
            this.searchBarView.$el.hide();
            this.$body.prepend(this.searchBarView.render().$el);
            this.views.push(this.searchBarView);
        }
          
          //attempt to render the views as needed to increase speed
        if(chosenSelection == "youtube"){

          if(this.isMobile){
              this.youtubeView = new YoutubeView({socket: this.socket, mobile: this.isMobile});
              this.youtubeView.$el.hide();
              this.$body.prepend(this.youtubeView.render().$el);
              this.views.push(this.youtubeView);
              this.currentSearchBarView = "youtube";
              this.showSearchBar(chosenSelection);
          }
          else {
            screenSelector = $('#youtube');
            this.mainView.mouseovercard(screenSelector);

          }

        }
        if(chosenSelection == "chrome"){

          if(this.isMobile){
              this.googleView = new GoogleView();
              this.googleView.$el.hide();
              this.$body.prepend(this.googleView.render().$el);
              this.views.push(this.googleView);
              this.currentSearchBarView = "google";
              this.showSearchBar(chosenSelection);
          }
          else {
            screenSelector = $('#chrome');
            this.mainView.mouseovercard(screenSelector);
          }
        
        }
        if(chosenSelection == "settings"){
            this.socket.emit('get-twitter-status'); //Check if logged in or not
            this.socket.emit('get-facebook-status'); //Check if logged in or not

          if(!this.isMobile){
            screenSelector = $('#settings');
            this.mainView.mouseovercard(screenSelector);
          } else {
            this.showSettingsModal();
          }
        }
        if(chosenSelection == "music"){
          if(!this.isMobile){
            screenSelector = $('#music');
            this.mainView.mouseovercard(screenSelector);
          } else {

          }
        }
        if(chosenSelection == "facebook"){
          if(!this.isMobile){
            screenSelector = $('#facebook');

            $('.tw-feed').html('<ul class="list-group" id="twitter-list"></ul>');



            this.socket.emit('on-click-facebook');

            this.mainView.mouseovercard(screenSelector);
          } else {

          }
        }
        if(chosenSelection == "twitter"){
          if(!this.isMobile){

            $('.fb-feed').html('<div id="facebook-list"><div id="fb_feed"></div></div>');


            this.socket.emit('on-click-twitter');

            screenSelector = $('#twitter');
            this.mainView.mouseovercard(screenSelector);


          } else {

          }
        }
        if(chosenSelection == "news"){
          if(!this.isMobile){
            screenSelector = $('#news');
            this.mainView.mouseovercard(screenSelector);
          } else {

          }
        }
        if(chosenSelection == "home"){
          if(!this.isMobile){
            screenSelector = $('#home');
            this.mainView.mouseovercard(screenSelector);
          } else {

          }
        }
      },

      showSettingsModal: function() {
        if(this.isMobile){
          this.settingsView.$el.show();
          $('#settingsModal').modal('show');
        }
      },

      showSearchBar: function(chosenSelection) {
        this.searchBarView.changeHeader(chosenSelection);
        this.searchBarView.$el.show();
        $('#myModal').modal('show');
      },

      closeSearchBar: function(){
        $('#myModal').modal('hide');
        this.remoteSocket.emit('modal-control',{action: 'close'});
      },

      submitSearchBar: function(data) {

        if(this.isMobile){
          var data = $('#searchBar').val();
          $('#myModal').modal('hide');
          this.remoteSocket.emit('modal-control',{action: 'submit', data: data, view: this.currentSearchBarView});
          var currentView = this.getCurrentSearchView(this.currentSearchBarView);
          currentView.newSearch(data);
          this.showOnly(currentView);
        }
      },

      onGoBack: function() {
        this.showOnly(this.mainView);
      },

      showOnly: function(view){
        if (view != this.currentView) {
          _.each(this.views, function (view) { view.$el.hide(); } );

          if (view.show) {
            view.show();
          }
          else {
            if(view == this.mainView){

              this.headerView.$el.hide();
            }
            view.$el.show();
          }
          this.currentView = view;
          document.documentElement.scrollTop = document.documentElement.scrollTop = 0;
        }
      },

      checkForMobile: function() {
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
         return true;
        } else {
          return false;
        }
      },

      getCurrentSearchView: function(view){
        if(view == "youtube"){
          return this.youtubeView;
        }
        else if(view == "google"){
          return this.googleView;
        }
      }
    });

    return WebRouter;
});
