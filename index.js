let routeArr = [];
let tour = [];
let markers = [];
let map;
let queryCity;

function getBreweryInfo(queryCity, region) {
	//needs proxy to complete requests to brewerydb due to github supporting only https//
	$.ajax({
		method: "GET",
		url: `https://cors-anywhere.herokuapp.com/http://api.brewerydb.com/v2/locations`,
		dataType: 'json',
		data: {
			locality: `${queryCity}`,
			region: `${region}`,
			key: config.BREWERYDB_KEY
		},
		success: function(data) {
			renderBreweryVars(data, queryCity, region);
		}
	});
}

function renderBreweryVars(data, queryCity, region) {
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
		geocodeAddress(geocoder, map, queryCity, region);
	}
}

function getMapData() {
	//makes request to goole maps for location and map services//
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
		zoom: 15,
	});
}

function geocodeAddress(geocoder, resultsMap, queryCity, region) {
	geocoder.geocode({
		'address': `${queryCity},${region}`
	}, function(results, status) {
		if (status === 'OK') {
			resultsMap.setCenter(results[0].geometry.location);
			markers.map((data, index) => {
				renderContentString(index, resultsMap);
			});
		} else if (status === 'OVER_QUERY_LIMIT') {
			wait = true;
			setTimeout("wait = true", 3000);
		} else if (status === 'ZERO_RESULTS') {
			wait = true;
			setTimeout("wait = true", 3000);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

function renderContentString(index, resultsMap) {
	//sets up the info window content//
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
	//creates the markers//
	setTimeout(function() {
		let icon = {
			url: "images/Beer-icon.png",
			scaledSize: new google.maps.Size(50, 50),
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(0, 0, )
		};
		let marker = new google.maps.Marker({
			map: resultsMap,
			position: {
				lat: markers[index].breweryLat,
				lng: markers[index].breweryLon
			},
			name: `${markers[index].breweryName}`,
			animation: google.maps.Animation.DROP,
			icon: icon
		});
		watchMarkerClick(marker, infowindow, resultsMap);
		clearMap(marker);
	}, index * 60);
}

function watchMarkerClick(marker, infowindow, resultsMap) {
	//sets up event listeners for map interaction//
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
			tour.push(breweryTitle);
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
		} else if (status === 'OVER_QUERY_LIMIT') {
			wait = true;
			setTimeout("wait = true", 3000);
		} else if (status === 'ZERO_RESULTS') {
			alert('Route could not be calculated.');
			return;
		} else {
			window.alert('Directions request failed due to: ' + status);
		}
	});
}

function renderTourItem(breweryTitle) {
	//sets up the tour items//
	let tourItem = `<div class="tour-item">
						<h2>${breweryTitle}<button class="close-button button"><i class="fa fa-times" aria-hidden="true"></i></button></h2>
					</div>`;
	insertTourItem(tourItem);
}

function insertTourItem(tourItem) {
	$('.tour').append(tourItem);
	removeTourItemFromRoute();
}

function removeTourItemFromRoute() {
	//uses the on page index of close button to find the index in the routeArr that needs to be removed//
	$('.close-button').off().on('click', function() {
		remInd = $('.close-button').index($(this));
		routeArr.splice(remInd, 1);
	});
	removeTourItemFromTour();
}

function removeTourItemFromTour() {
	$('.close-button').on('click', function() {
		$(this).closest('.tour-item').remove();
	});
}

function clearMap(marker) {
	$('.form-container').on('click', '#search-button', event => {
		marker.setMap(null);
	});
}

function convertStateAbbr(queryReg) {
	const states = [
		['Arizona', 'AZ'],
		['Alabama', 'AL'],
		['Alaska', 'AK'],
		['Arkansas', 'AR'],
		['California', 'CA'],
		['Colorado', 'CO'],
		['Connecticut', 'CT'],
		['Delaware', 'DE'],
		['Florida', 'FL'],
		['Georgia', 'GA'],
		['Hawaii', 'HI'],
		['Idaho', 'ID'],
		['Illinois', 'IL'],
		['Indiana', 'IN'],
		['Iowa', 'IA'],
		['Kansas', 'KS'],
		['Kentucky', 'KY'],
		['Louisiana', 'LA'],
		['Maine', 'ME'],
		['Maryland', 'MD'],
		['Massachusetts', 'MA'],
		['Michigan', 'MI'],
		['Minnesota', 'MN'],
		['Mississippi', 'MS'],
		['Missouri', 'MO'],
		['Montana', 'MT'],
		['Nebraska', 'NE'],
		['Nevada', 'NV'],
		['New Hampshire', 'NH'],
		['New Jersey', 'NJ'],
		['New Mexico', 'NM'],
		['New York', 'NY'],
		['North Carolina', 'NC'],
		['North Dakota', 'ND'],
		['Ohio', 'OH'],
		['Oklahoma', 'OK'],
		['Oregon', 'OR'],
		['Pennsylvania', 'PA'],
		['Rhode Island', 'RI'],
		['South Carolina', 'SC'],
		['South Dakota', 'SD'],
		['Tennessee', 'TN'],
		['Texas', 'TX'],
		['Utah', 'UT'],
		['Vermont', 'VT'],
		['Virginia', 'VA'],
		['Washington', 'WA'],
		['West Virginia', 'WV'],
		['Wisconsin', 'WI'],
		['Wyoming', 'WY'],
	];
	let region = queryReg.replace(/ /g, '');
	for (let i = 0; i < states.length; i++) {
		if (states[i][1] === region) {
			region = states[i][0];
		}
	}
	getBreweryInfo(queryCity, region);
}

function watchSubmit() {
	$('.form-container').on('click touch', '#search-button', event => {
		event.preventDefault();
		let query = $('#query').val();
		if (query.length == 0 || query.indexOf(',') == -1) {
			alert('Please enter a valid City, State combination separated by a comma. Example: "Billings, Montana" or "Billings, MT"');
			return;
		}
		query = query.toUpperCase();
		query = query.split(',');
		queryCity = query[0];
		let queryReg = query[1];
		$('.form-container').removeClass('center').removeClass('tinted-image');
		$('.form-container p').removeClass('hidden');
		$('h1').css('font-size', '3rem');
		markers = [];
		routeArr = [];
		tour = [];
		waypts = [];
		convertStateAbbr(queryReg);
		$('.tour').empty();
		$('#query').val('');
	});
}

function handleTour() {
	watchSubmit();
	getMapData();
}
$(handleTour);