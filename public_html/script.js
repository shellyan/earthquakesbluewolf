var map;
var markers=[];

 //initial configuration of the map
function initialize() {
  //the entire world
  var latlng = new google.maps.LatLng(0, 0);
  var mapOptions = {
    zoom: 2,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  //set markers with top 10 earthquakes this year and make list
  setMarkers(true);

  //heading of page
  document.getElementById('location').innerHTML="Top 10 Earthquakes Last Year";

}

//everytime we search for other location
function updateLocation() {
  resetMarkers();

  setLocation();
  
  setMarkers(false);

}

//change map to center it on location
function setLocation(){
  var geocoder = new google.maps.Geocoder();
  //location searched
  var address = document.getElementById('address').value;
  //heading of page
  document.getElementById('location').innerHTML="Earthquakes around " + address;
  
  //search location in google maps and use first result
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      //center as center of location
      map.setCenter(results[0].geometry.location);
      //adapt zoom level to include entire location and is surroundings
      if (results[0].geometry.viewport) 
          map.fitBounds(results[0].geometry.viewport);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

//Everytime we change location, eliminate old earthquakes
function resetMarkers(){
  //take them out of map and reset array of markers
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers=[];
}

//put earthquakes in new location
//initialize is boolean that is true the first time we include markers (top 10 earthquakes)
function setMarkers(initialize){
  //only do it when map changes location
   google.maps.event.addListenerOnce(map, 'bounds_changed', function() {
      //look for earthquakes inside the scope of map
      //had to decide a bounding box to search for earthquakes.
      //Instead of using an algorithm where bounding box is centered on center of location and radius is fixed or depends of population for example
      //we know that google adapts the map bounds to include entire location and its surrondings. So the bounds of the map are a very accurate and flexible bounding box.
      //It also gives us a lot of flexibility of what to search for, what kind of locations: anything that can be searched in google maps
      //And search not only a very particular location but its surrondings (earthquakes are not felt in the epicenter)    
      var limits=map.getBounds();
      var north=limits.getNorthEast().lat();
      var east=limits.getNorthEast().lng();
      var south=limits.getSouthWest().lat();
      var west=limits.getSouthWest().lng();

      //get the max number of results (500)
      $.getJSON("http://api.geonames.org/earthquakesJSON?north="+north+"&south="+south+"&east="+east+"&west="+west+"&maxRows=500&username=tiagopaisbluewolf", function(response){
           //have different methods for the initial markers and a normal search
           if(initialize){
            defineInitialMarkers(response);
           } else {
            defineMarkers(response);
           }
      });
    
    });
}

//define markers based on the earthquake response
function defineMarkers (response){
  //Array of info about different earthquakes
  var contentString=[];
  for(var i=0;i<response.earthquakes.length;i++)
  {   
      //Include all the information in a infowindow that pops up when we press the marker
      contentString[i] ='<div id="content">' +
              '<h1> Eqid:'+ response.earthquakes[i].eqid + '</h1>' +
              '<p> Magnitude: ' + response.earthquakes[i].magnitude + '   Depth: '+ response.earthquakes[i].depth + '</p>' +
              '<p> Latitude: ' + response.earthquakes[i].lat + '   Longitude: '+ response.earthquakes[i].lng + '</p>' +
              '<p> Time: ' + response.earthquakes[i].datetime + '   Source: '+ response.earthquakes[i].src + '</p>' +
              '</div>';

      var infowindow = new google.maps.InfoWindow();

      //locate marker
      var myLatlng=new google.maps.LatLng(response.earthquakes[i].lat,response.earthquakes[i].lng);
      var marker = new google.maps.Marker({
         position: myLatlng,
         map: map,
        title: 'Earthquake'
      });

      //Add listener so each time we click, the corresponding infowindow pops up
      google.maps.event.addListener(marker, 'click', (function(marker, i) {
        return function() {
            infowindow.setContent(contentString[i]);
            infowindow.open(map, marker);
        }
      })(marker, i));

      //add marker to array of markers.
      markers.push(marker);

  }

}

//set markers with top 10 earthquakes this year and make list
function defineInitialMarkers(response){
  var contentString=[];
  //we want only results from the last year
  var threshold=new Date();
  //If Feb 29 we consider March 1st the date 1 year ago
  threshold.setFullYear(threshold.getFullYear()-1);   
  //Need 2 counters, j is for the number of results from last year.  
  var j=0;
  //HTML of the list of 10 earthquakes
  var EQlist="Top Earthquakes Last Year:<br/>";
  //Results are ordered by magnitude
  for(var i=0;i<response.earthquakes.length;i++)
  { 
    //only include them if they are from last year. Have to parse result to adapt date and time to ISO format    
    var date= new Date(response.earthquakes[i].datetime.replace(" ","T")+"Z");
    
    if(date>threshold){
        //Include all the information in a infowindow that pops up when we press the marker
        contentString[j] ='<div id="content">' +
        '<h1> Eqid:'+ response.earthquakes[i].eqid + '</h1>' +
        '<p> Magnitude: ' + response.earthquakes[i].magnitude + '   Depth: '+ response.earthquakes[i].depth + '</p>' +
        '<p> Latitude: ' + response.earthquakes[i].lat + '   Longitude: '+ response.earthquakes[i].lng + '</p>' +
        '<p> Time: ' + response.earthquakes[i].datetime + '   Source: '+ response.earthquakes[i].src + '</p>' +
        '</div>';

        //Add result to list
        EQlist+=(j+1)+") Equid: " + response.earthquakes[i].eqid+ ", Magnitude: " + response.earthquakes[i].magnitude + "<br/>";
        
        var infowindow = new google.maps.InfoWindow();

         //locate marker
        var myLatlng=new google.maps.LatLng(response.earthquakes[i].lat,response.earthquakes[i].lng);
        var marker = new google.maps.Marker({
          position: myLatlng,
          map: map,
          title: 'Earthquake'
         });

        //Add listener so each time we click, the corresponding infowindow pops up
        google.maps.event.addListener(marker, 'click', (function(marker, j) {
          return function() {
            infowindow.setContent(contentString[j]);
          infowindow.open(map, marker);
         }
        })(marker, j));

        //Add it to array of markers
        markers.push(marker);
        
        //only want 10 results
        j++;
        if(j>9){
          break;
        }
    }
  }

  //Remove last blank line (<br/>) from list and add it to correct place
  EQlist=EQlist.substring(0,EQlist.length-5);
  document.getElementById('list').innerHTML=EQlist;
}

google.maps.event.addDomListener(window, 'load', initialize);