
//// CONFIGURE
//// copy in the business spreadsheet url (be sure you're on the right tab and that the sheet is publicly "viewable")
var businessSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1P8042q3PfithAudtrIY5Ce6VbMc_zViIRB7tFQ_rUBg/#gid=1872708460';

var tourSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1P8042q3PfithAudtrIY5Ce6VbMc_zViIRB7tFQ_rUBg/edit#gid=1872708460';

///////////////////////////////////////////////////////////////////////////////////////////////////


var clusterGroupMarkers = new L.MarkerClusterGroup({
    showCoverageOnHover: false,
    animateAddingMarkers: false,
    maxClusterRadius: 35,
    disableClusteringAtZoom: 15
});

var plainGroupMarkers = new L.FeatureGroup();

var map;

var businessStore = {};

var tourStore = {};

var businessTemplate;

var tourTemplate;


//jQuery to collapse the navbar on scroll
$(window).scroll(function() {
    //if ($(".navbar").offset().top > 50) {
    //    $(".navbar-fixed-top").addClass("top-nav-collapse");
    //} else {
    //    $(".navbar-fixed-top").removeClass("top-nav-collapse");
    //}
});

//jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

function updateDisplay(){

    var businessContainer = $('#business_container');
    var tourContainer = $('#tour_container');

    //reset display

    //TODO: markers.clearLayers();

    businessContainer.empty();
    tourContainer.empty();

    //based on what's selected, or what's being searched

    if (true){

        var oms = new OverlappingMarkerSpiderfier(map);

        $.map(businessStore, function(businessObject){
            // iterate through objects and add to display
            businessContainer.append(businessTemplate(businessObject));

            // add marker
            //TODO: set marker icon & color

            var coords = $(businessObject.venueCoordinates);
            if (coords.length == 2 && ($.isNumeric(coords[0]) && $.isNumeric(coords[1]))){
                var marker = L.marker(new L.LatLng(coords[0], coords[1]), {
                    title: businessObject.businessName,
                    riseOnHover: true
                });
                plainGroupMarkers.addLayer(marker);
                clusterGroupMarkers.addLayer(marker);
                oms.addMarker(marker);
            }
        });


    } else {
        //iterate through tours
        // create marker icon, set color
        //add marker
        //add handlebar template
    }

}

function setActiveLayers() {
    if (map.getZoom() < 9 && map.hasLayer(clusterGroupMarkers)) {
        map.removeLayer(clusterGroupMarkers);
    }
    if (map.getZoom() >= 9 && map.hasLayer(clusterGroupMarkers) == false) {
        map.addLayer(clusterGroupMarkers);
    }
}

$(document).ready(function () {

    //tech tour map id: mlake900.nb1o1aik

    var zoomLevel = 14;
    if ($(window).width() < 550) zoomLevel = 12;

    L.mapbox.accessToken = 'pk.eyJ1IjoibWxha2U5MDAiLCJhIjoiSXV0UEF6dyJ9.8ZrYcafYb59U67LHErUegw';
    map = L.mapbox.map('map', 'mlake900.lae6oebe', {
        zoomControl: true

    }).setView([38.032, -78.492], zoomLevel);
    //map.dragging.disable();
    //map.touchZoom.disable();
    //map.doubleClickZoom.disable();


    map.scrollWheelZoom.disable();
    map.zoomControl.setPosition('topright');

    map.on('zoomend', function () {
        setActiveLayers();
    });

    setActiveLayers();
    //TODO: L.control.fullscreen({position: "topright"}).addTo(map);


    businessTemplate = Handlebars.compile($('#business_template').html());
    tourTemplate = Handlebars.compile($('#tour_template').html());


    var businessSpreadsheetCallback = function (error, options, response){

        if (error){
            console.log(error);
        } else {
            response.rows.forEach(function(row){
                //save as structured data

                businessStore[row.cells["Name"]] = {
                    "businessName" : row.cells["Name"],
                    "venueName": row.cells["TourVenue"],
                    "venueAddress": row.cells["TourAddress"],
                    "venueCoordinates": row.cells["TourGPS"].split(",")
                };
            });

            //finished processing spreadsheet rows
            setTimeout(updateDisplay, 100);

            //TODO: call sheetrock to grab tours
        }
    };

    $('#business_container').sheetrock({
        url: businessSpreadsheet,
        headersOff: true,
        rowGroups: false,
        sql: "select * where D contains 'YES' order by A",
        callback: businessSpreadsheetCallback,
        reset: true
    });

});



