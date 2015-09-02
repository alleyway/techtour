//// CONFIGURE
//// copy in the business spreadsheet url (be sure you're on the right tab and that the sheet is publicly "viewable")
var businessSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1P8042q3PfithAudtrIY5Ce6VbMc_zViIRB7tFQ_rUBg/#gid=1872708460';

var tourSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1P8042q3PfithAudtrIY5Ce6VbMc_zViIRB7tFQ_rUBg/edit#gid=1737014077';

///////////////////////////////////////////////////////////////////////////////////////////////////


var clusterGroupMarkers = new L.MarkerClusterGroup({
    showCoverageOnHover: false,
    animateAddingMarkers: false,
    maxClusterRadius: 35,
    disableClusteringAtZoom: 15
});

var plainGroupMarkers = new L.FeatureGroup();

var map;

var oms;

var businessStore = {};

var tourStore = {};

var businessTemplate;

var tourTemplate;

var businessTabSelected = true;

//jQuery to collapse the navbar on scroll
$(window).scroll(function () {
    //if ($(".navbar").offset().top > 50) {
    //    $(".navbar-fixed-top").addClass("top-nav-collapse");
    //} else {
    //    $(".navbar-fixed-top").removeClass("top-nav-collapse");
    //}
});

//jQuery for page scrolling feature - requires jQuery Easing plugin
$(function () {
    $('a.page-scroll').bind('click', function (event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});


$(function () {
    $('.selection_container li').bind('click', function (event) {
        if ($(event.target).hasClass("active_tab")) return;
        event.preventDefault();
        $('.selection_container li').toggleClass("active_tab");
        var searchField = $('#search');
        searchField.val("");
        searchField.focus();
        businessTabSelected = !businessTabSelected;
        if (businessTabSelected) {
            searchField.attr("placeholder", "Search businesses..")
        } else {
            searchField.attr("placeholder", "Search tours..")
        }

        updateDisplay();

    });
});

$(function () {
    $('#search').keyup(function (event) {
        updateDisplay();
    });
});

function updateDisplay() {

    var entryContainer = $('#entry_container');

    //reset display

    clusterGroupMarkers.clearLayers();
    plainGroupMarkers.clearLayers();
    oms.clearMarkers()

    entryContainer.empty();

    //based on what's selected, or what's being searched

    var searchValue = $('#search').val().toLowerCase();

    if (businessTabSelected) {

        $.map(businessStore, function (businessObject) {

            if (searchValue.length > 0) {
                var found = false;
                if (businessObject.businessName.toLowerCase().indexOf(searchValue) > -1) {
                    found = true;
                }
                if (!found) return;
            }

            // iterate through objects and add to display
            entryContainer.append(businessTemplate(businessObject));

            var coords = $(businessObject.venueCoordinates);
            if (coords.length == 2 && ($.isNumeric(coords[0]) && $.isNumeric(coords[1]))) {
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

        var count = -1;
        $.map(tourStore, function (tourObject) {

            if (searchValue.length > 0) {
                var found = false;
                if (tourObject.tourGroupName.toLowerCase().indexOf(searchValue) > -1) {
                    found = true;
                }
                if (!found) return;
            }

            count++;
            //TODO: color icon based on which number we're in

            // iterate through objects and add to display
            entryContainer.append(tourTemplate(tourObject));

            tourObject.stops.forEach(function (tourStop) {

                if (tourStop.business == undefined) return;

                var coords = $(tourStop.business.venueCoordinates);
                if (coords.length == 2 && ($.isNumeric(coords[0]) && $.isNumeric(coords[1]))) {
                    var marker = L.marker(new L.LatLng(coords[0], coords[1]), {
                        title: tourStop.business.businessName,
                        riseOnHover: true
                    });
                    plainGroupMarkers.addLayer(marker);
                    clusterGroupMarkers.addLayer(marker);
                    oms.addMarker(marker);
                }

            });

        });

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

function fetchTours() {


    var tourSpreadsheetCallback = function (error, options, response) {

        if (error) {
            console.log(error);
        } else {
            response.rows.forEach(function (row) {
                //save as structured data

                var tourGroupName = row.cells["TourGroupName"];
                // Some bug in Sheetrock isn't skipping the header for some reason..
                if (tourGroupName == "TourGroupName") return;

                if ($.isNumeric(tourGroupName)) tourGroupName = "Tour Group " + tourGroupName;

                if (!tourStore.hasOwnProperty(tourGroupName)) {
                    //initialize property if doesn't exist yet
                    tourStore[tourGroupName] = {
                        "bus": row.cells["Bus"],
                        "tourGroupName": tourGroupName,
                        "stops": []
                    };
                }

                var businessName = row.cells["Business"];

                var businessObject = businessStore[businessName];

                var tour = tourStore[tourGroupName];

                tour.stops[tour.stops.length] = {
                    "tourTime": row.cells["Time"],
                    "tourGuide": row.cells["Guide"],
                    "business": businessObject
                }
            });

            //finished processing spreadsheet rows
            //setTimeout(updateDisplay, 100);
        }
    };

    $('#tour_container').sheetrock({
        url: tourSpreadsheet,
        sql: "select *",
        callback: tourSpreadsheetCallback,
        reset: true
    });

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

    oms = new OverlappingMarkerSpiderfier(map);

    map.scrollWheelZoom.disable();
    map.zoomControl.setPosition('topright');

    map.on('zoomend', function () {
        setActiveLayers();
    });

    setActiveLayers();
    //TODO: L.control.fullscreen({position: "topright"}).addTo(map);


    businessTemplate = Handlebars.compile($('#business_template').html());
    tourTemplate = Handlebars.compile($('#tour_template').html());


    var businessSpreadsheetCallback = function (error, options, response) {

        if (error) {
            console.log(error);
        } else {
            response.rows.forEach(function (row) {
                //save as structured data

                businessStore[row.cells["Name"]] = {
                    "businessName": row.cells["Name"],
                    "venueName": row.cells["TourVenue"],
                    "venueAddress": row.cells["TourAddress"],
                    "venueCoordinates": row.cells["TourGPS"].split(",")
                };
            });

            //finished processing spreadsheet rows
            setTimeout(updateDisplay, 100);

            setTimeout(fetchTours, 100);

        }
    };

    $('#business_container').sheetrock({
        url: businessSpreadsheet,
        sql: "select * where D contains 'YES' order by A",
        callback: businessSpreadsheetCallback,
        reset: true
    });
    $('#search').focus();
});



