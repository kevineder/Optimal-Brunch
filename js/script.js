/* Author:

*/
$(function(){

  /**
   * Models
   */

  var Location = Backbone.Model.extend({

    initialize: function() {
      _.bindAll(this);
      var geocoder = new google.maps.Geocoder();
      this.set({"text" : "", "geocoder" : geocoder});
    },

    clear: function() {
      this.destroy();
    },
    
    //Geocodes the text property of the object. 
    geocode: function() {
      var geocoder = this.get("geocoder");
      var _this = this;
      
      geocoder.geocode({ 'address': this.get("text") }, function (results, status) {
        _this.handleGeocodeResponse.call(_this, results, status); 
      });
    },

    /**
     * If geocoding was successful, this function first searches for existing duplication Locations.
     * If one is found, this Location is destroyed. Otherwise, the lat/lon properties of the Location are set
     * and the text property is overwritten with the normalized address from Google.
     */
    handleGeocodeResponse: function(results, status) {
      if (status == window.google.maps.GeocoderStatus.OK) {
          var resultLocation = results[0];
          var address = resultLocation.formatted_address;
          var lat = resultLocation.geometry.location.Xa;
          var lon = resultLocation.geometry.location.Ya;

          var dupes = Locations.find(function(l) {
            return (l.get("lat") == lat && l.get("lon") == lon);
          });

          if (!dupes) {
            this.set({"text" : address, "lat" : lat, "lon" : lon});
          }
          else {
            this.destroy();
          }
       }
       else {
          console.log("Geocoding failed: " + status);
       }
    }

  });
   
  var LocationsList = Backbone.Collection.extend({
    model: Location,

    initialize: function() {
      _.bindAll(this);
    },

  });

  window.Locations = new LocationsList;

  /**
   * Views
   */

  var MapView = Backbone.View.extend({

    el: $("#map-canvas"),

    initialize: function(opts) {
      _.bindAll(this);
      this.render();
      Locations.bind('change', this.render);
    },

    render: function() {
      console.log('render');
      var latlng = new google.maps.LatLng(
        "40.7142", "-74.0064");
      var options = {
        zoom: 11,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      // create map
      if (typeof(this.map) === "undefined") {
        console.log("creating map");
        this.map = new google.maps.Map(this.el, options);
      }
      
      var _this = this;
      Locations.each(function(l) {
        if (l && !l.get("mapped") && l.get("lat")) {
          var loc = new google.maps.LatLng(l.get("lat"), l.get("lon"));
          console.log("Pin: " + loc);
          var marker = new google.maps.Marker({
            position: loc,
            map: _this.map,
          });

          l.set({"mapped" : true});
        }
        else {
          console.log("ignoring");
        }
      });

      return this;
    }
  });

  window.mapView = new MapView;

  var LocationView = Backbone.View.extend({
    clear: function() {
      this.model.clear();
    }
  });

  var AppView = Backbone.View.extend({
    el: $("#optimal-brunch"),

    initialize: function() {
      _.bindAll(this);

      this.input = this.$("#address-input");
      this.input.focus();
    },

    events: {
      "keypress #address-input":  "createOnEnter",
    },

    //Creates a new Location object when the user presses enter.
    createOnEnter: function(e) {
      if (!this.input.val()) return;
      if (e.keyCode != 13) return;

      //Make a new Location, geocode it, and add it to the Locations collection.
      var l = new Location();
      l.set({ "text": this.input.val() });
      Locations.add(l);
      l.geocode();

      //Clear the input box.
      this.input.val('');
      this.input.attr("placeholder","Your friend's address.");
    }
    
  });

  window.App = new AppView;
});

