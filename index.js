let markers = [];
let map;

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
			renderBreweryVars(data, query);
		}
	});
}

function renderBreweryVars(data ,query) {
	const breweryInfo = data.data.map((data, index) => {
		const breweryVals = {
			breweryName: data.brewery.name,
			breweryLat: data.latitude,
			breweryLon: data.longitude,
		}
		markers.push(breweryVals);
	});
	var geocoder = new google.maps.Geocoder();
	geocodeAddress(geocoder, map, query);
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
			initMap(data);
		}
	});
	console.log('getMapData() ran')
}

function initMap(data) {
		map = new google.maps.Map(document.getElementById('map'), {
		zoom: 14,
		center: {
			lat: 44.2911111,
			lng: -105.5016667
		}
	});
}

function geocodeAddress(geocoder, resultsMap, address) {
	geocoder.geocode({
		'address': address
	}, function(results, status) {
		if (status === 'OK') {
			resultsMap.setCenter(results[0].geometry.location);
			markers.map((data, index) => {
			setTimeout(function() {
				let marker = new google.maps.Marker({
					map: resultsMap,
					position: {
						lat: markers[index].breweryLat,
						lng: markers[index].breweryLon
					},
					title: `${markers[index].breweryName}`,
					animation: google.maps.Animation.DROP
				});
				$('.form-container').on('click', '#search-button', event => {
					marker.setMap(null);
				});
			}, index * 200);
			});
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}


function watchSubmit() {
	$('.form-container').on('click', '#search-button', event => {
		event.preventDefault();
		$('.form-container').removeClass('center').css('height', '100%').css('width', '250px').css('padding-top', '2%');
		const query = $('#query').val();
		markers = [];
		getBreweryInfo(query);
		$('#query').val('');
	});
}

function handleTour() {
	watchSubmit();
	getMapData();
}
$(handleTour);