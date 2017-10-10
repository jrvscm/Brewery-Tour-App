let routeArr = [];
let tour = [];
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
			renderBreweryVars(data, query);
		}
	});
}

function renderBreweryVars(data, query) {
	if (data.data == undefined) {
		alert(`Sorry, nothing was found for that location!`)
	} else {
		const breweryInfo = data.data.map((data, index) => {
			const breweryVals = {
				breweryName: data.brewery.name,
				breweryLat: data.latitude,
				breweryLon: data.longitude,
				address: data.streetAddress,
				city: data.locality,
				state: data.region
			}
			markers.push(breweryVals);
		});
		var geocoder = new google.maps.Geocoder();
		geocodeAddress(geocoder, map, query);
	}
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
}

function initMap(data) {
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 14,
	});
}

function geocodeAddress(geocoder, resultsMap, query) {
	geocoder.geocode({
		'address': query
	}, function(results, status) {
		if (status === 'OK') {
			resultsMap.setCenter(results[0].geometry.location);
			markers.map((data, index) => {
				renderContentString(index, resultsMap);
			});
		} else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
			wait = true;
			setTimeout("wait = true", 2000);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

function renderContentString(index, resultsMap) {
	let contentString = `<div><p>${markers[index].breweryName}<br>
							${markers[index].address}<br>
							${markers[index].city}, 
							${markers[index].state}</p></div>`;
	createInfoWindow(contentString, index, resultsMap);
}

function createInfoWindow(contentString, index, resultsMap) {
	let infowindow = new google.maps.InfoWindow({
		content: contentString
	});
	renderMarker(infowindow, index, resultsMap);
}

function renderMarker(infowindow, index, resultsMap) {
	setTimeout(function() {
		let marker = new google.maps.Marker({
			map: resultsMap,
			position: {
				lat: markers[index].breweryLat,
				lng: markers[index].breweryLon
			},
			name: `${markers[index].breweryName}`,
			animation: google.maps.Animation.DROP
		});
		watchMarkerClick(marker, infowindow, resultsMap);
		clearMap(marker);
	}, index * 180);
}

function watchMarkerClick(marker, infowindow, resultsMap) {
	marker.addListener('mouseover', function() {
		infowindow.open(resultsMap, marker);
	});
	marker.addListener('mouseout', function() {
		infowindow.close(resultsMap, marker);
	});
	marker.addListener('click', function() {
		$('.route').removeClass('hidden');
		let breweryTitle = `${marker.name}`;
		let tourLatLng = `${marker.position}`;
		tourLatLng = tourLatLng.split('').slice(0 + 1, tourLatLng.length - 1).join('');
		if (tour.indexOf(breweryTitle) == -1) {
			tour.push(breweryTitle, tourLatLng);
			routeArr.push(tourLatLng);
			renderTourItem(breweryTitle);
		}
	});
	getRoute(resultsMap);
}

function getRoute(resultsMap) {
	let directionsService = new google.maps.DirectionsService;
	let directionsDisplay = new google.maps.DirectionsRenderer;
	$('.form-container').on('click', '.route', event => {
		directionsDisplay.setMap(resultsMap);
		calculateAndDisplayRoute(directionsService, directionsDisplay);
	});
}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
	let waypts = [];
	for (let i = 0; i < routeArr.length; i++) {
		waypts.push({
			location: routeArr[i],
			stopover: false
		});
	}
	directionsService.route({
		origin: routeArr[0],
		destination: routeArr[routeArr.length - 1],
		waypoints: waypts,
		optimizeWaypoints: true,
		travelMode: 'DRIVING',
	}, function(response, status) {
		if (status === 'OK') {
			directionsDisplay.setDirections(response);
		} else if (status == google.maps.Directions.OVER_QUERY_LIMIT) {
			wait = true;
			setTimeout("wait = true", 2000);
		} else {
			window.alert('Directions request failed due to: ' + status);
		}
	});
}

function renderTourItem(breweryTitle) {
	let tourItem = `<div class="tour-item">
						<h2>${breweryTitle}<button class="close-button button"><i class="fa fa-times" aria-hidden="true"></i></button></h2>
					</div>`;
	insertTourItem(tourItem);
}

function insertTourItem(tourItem) {
	$('.tour').append(tourItem);
	removeTourItem(tourItem);
}

function removeTourItem(tourItem) {
	console.log(routeArr)
	let indArr = [];
	$('.tour').on('click', '.close-button', function() {
	let index = $(this).index('.close-button');
	indArr.push(index);
	});
	for(indArr)
}

function clearMap(marker) {
	$('.form-container').on('click', '#search-button', event => {
		marker.setMap(null);
	});
}

function watchSubmit() {
	$('.form-container').on('click touch', '#search-button', event => {
		event.preventDefault();
		let query = $('#query').val();
		if (query.length == 0) {
			alert('Please enter a valid city name.');
			return;
		}
		$('.form-container').removeClass('center').removeClass('tinted-image');
		$('.form-container p').removeClass('hidden');
		$('h1').css('font-size', '3rem');
		markers = [];
		routeArr = [];
		tour = [];
		waypts = []
		getBreweryInfo(query);
		$('.tour').empty();
		$('#query').val('');
	});
}

function handleTour() {
	watchSubmit();
	getMapData();
}
$(handleTour);