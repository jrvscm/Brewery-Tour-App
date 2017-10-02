const markers = [];

function watchSubmit() {
	$('.form-container').off().on('click', '#search-button', event=> {
		event.preventDefault();
		$('.form-container').removeClass('center').css('height', '100%').css('width', '250px').css('padding-top', '2%');
		const query = $('#query').val();
		getBreweryInfo(query);
		$('#query').val('');
	});
}


function getBreweryInfo(query) {
	$.ajax({
		method: "GET",
		url: `https://cors-anywhere.herokuapp.com/http://api.brewerydb.com/v2/locations`,
		dataType: 'json',
		data: {
			locality: `${query}`,
			key: config.BREWERYDB_KEY
		},
		success: function(data) {
				console.log(data);
				renderBreweryVars(data);
			}
		});
		}

function renderBreweryVars(data) {
	const breweryInfo = data.data.map((data, index) => {
	
	const breweryVals = {
	breweryName: data.brewery.name,
	breweryLat: data.latitude,
	breweryLon: data.longitude
	}
	markers.push(breweryVals);
	});
	 renderMarkers();
}


function getMapData() {
$.ajax({
		method: "GET",
		url: `https://maps.googleapis.com/maps/api/js?`,
		dataType: 'jsonp',
		data: {
			key: config.GOOGLEMAPS_KEY
		},
		success: function(data) {
			console.log('success');
			initMap();
	}
});
}


function initMap() {
        var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: {lat:44.2911111,lng:-105.5016667}
        });
        var geocoder = new google.maps.Geocoder();
        document.getElementById('search-button').addEventListener('click', function() {
          geocodeAddress(geocoder, map);
        });
        console.log('initMap() ran')
      }

function geocodeAddress(geocoder, resultsMap) {
        var address = document.getElementById('query').value;
        geocoder.geocode({'address': address}, function(results, status) {
          if (status === 'OK') {
          resultsMap.setCenter(results[0].geometry.location);
          var marker = new google.maps.Marker({
          map: resultsMap,
          position: results[0].geometry.location
          });
          } else {
            alert('Geocode was not successful for the following reason: ' + status);
          }
        });


        console.log('geoCodeAddress ran')
      }

function renderMarkers() {
	markers.map((data, index) => {
		console.log(markers[index].breweryLat, markers[index].breweryLon)
		var myLatLng = new google.maps.LatLng(markers[index].breweryLat, markers[index].breweryLon);
		
		var mapOptions = {
		zoom:15,
		center: myLatLng
		}
		var map = new google.maps.Map(document.getElementById("map"), mapOptions);
		var breweryName = `${markers[index].breweryName}`;

		console.log(myLatLng)
		console.log(breweryName)
		var marker = new google.maps.Marker({
    		position: myLatLng,
    		title:`${breweryName}`
		});
		marker.setMap(map);
	});
}


function handleTour() {
watchSubmit();
getMapData();
}

$(handleTour);
