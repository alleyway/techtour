var apiKey = '5a58c5857cc3f5c57beb8fdda75b8c55c7dacfb';

$(document).ready(function () {


    L.mapbox.accessToken = 'pk.eyJ1IjoibWxha2U5MDAiLCJhIjoiSXV0UEF6dyJ9.8ZrYcafYb59U67LHErUegw';
    var map = L.mapbox.map('locate_map_element', 'mlake900.n831c986', {
        zoomControl: true

    }).setView([38.032, -78.492], 15);
    map.zoomControl.setPosition('topright');


    L.control.layers({
        "Satellite": map.tileLayer,
        "Street": L.mapbox.tileLayer("mlake900.lae6oebe")
    }, null).addTo(map);

    var markers = new L.FeatureGroup();
    markers.addTo(map);

    var marker = L.marker([38.032, -78.492], {
        title: "test",
        draggable: true,
        icon: L.mapbox.marker.icon({
            'marker-color': '#03a9f4'
        })
    });

    markers.addLayer(marker);

    marker.on('dragend', function(event){
        var marker = event.target;
        var position = marker.getLatLng();

        $("#pre_form_gps").val(position.lat + "," + position.lng);

    });



    $("#pre_form_button").on('click', function(e){

        var address = $("#pre_form_address").val();
        var name = $("#pre_form_name").val();

        $.get('https://api.geocod.io/v1/geocode?q='+ encodeURIComponent(address) +'&api_key=' + encodeURIComponent(apiKey), function (response) {
            console.log(response.results);

            var coordArray = [response.results["0"].location.lat, response.results["0"].location.lng];

            $("#pre_form_gps").val(coordArray[0] + "," + coordArray[1]);

            marker.setLatLng(L.latLng(coordArray[0], coordArray[1]));
            marker.bindPopup("<b>" + name + "</b>", {
                keepInView: false,
                closeButton: false,
                closeOnClick: false
            });

            map.setView(coordArray, 17);

            marker.openPopup();
        });
    });



});