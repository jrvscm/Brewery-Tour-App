function watchSubmit() {
	$('.form-container').off().on('click', '#search-button', event=> {
		event.preventDefault();
		$('.form-container').removeClass('center').css('height', '80%');
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
			key: `130345cc1aee53c8eea5de3039902cc1`
		},
		success: function(data) {
			console.log(data);
		}
	});	
}


function handleTour() {
watchSubmit();
}

$(handleTour);
