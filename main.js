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
    disableClusteringAtZoom: 13
});

var plainGroupMarkers = new L.FeatureGroup();

var map;

var oms;

var businessStore = {};

var tourStore = {};

var businessTemplate;

var businessDetailTemplate;

var tourTemplate;

var currentSelected = null;

var lastTapped = null;

var businessTabSelected = true;

var distinctColors = ["#00FF00", "#0000FF", "#FF0000", "#01FFFE", "#FFA6FE", "#FFDB66", "#006401", "#010067", "#95003A", "#007DB5",
    "FF00F6", "#FFEEE8", "#774D00", "#90FB92", "#0076FF", "#D5FF00", "#FF937E", "#6A826C", "#FF029D", "#FE8900", "#7A4782", "#7E2DD2",
    "85A900", "#FF0056", "#A42400", "#00AE7E", "#683D3B", "#BDC6FF", "#263400", "#BDD393", "#00B917", "#9E008E", "#001544", "#C28C9F",
    "FF74A3", "#01D0FF", "#004754", "#E56FFE", "#788231", "#0E4CA1", "#91D0CB", "#BE9970", "#968AE8", "#BB8800", "#43002C", "#DEFF74",
    "00FFC6", "#FFE502", "#620E00", "#008F9C", "#98FF52", "#7544B1", "#B500FF", "#00FF78", "#FF6E41", "#005F39", "#6B6882", "#5FAD4E",
    "A75740", "#A5FFD2", "#FFB167", "#009BFF", "#E85EBE"];

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
        focusIfDesktop();
        businessTabSelected = !businessTabSelected;
        if (businessTabSelected) {
            searchField.attr("placeholder", "Search businesses..")
        } else {
            searchField.attr("placeholder", "Search tours..")
        }
        resetZoom();
        updateDisplay();
        currentSelected = null;

    });
});

$(function () {
    $('#search').keyup(function (event) {
        updateDisplay();
    });
});

function resetZoom() {

    var zoomLevel = 14;
    if ($(window).width() < 550) zoomLevel = 12;

    map.setZoom(zoomLevel);
}

function createBusinessMarker(businessObject) {

    var coords = $(businessObject.venueCoordinates);

    if (coords.length == 2 && ($.isNumeric(coords[0]) && $.isNumeric(coords[1]))) {

        var icon = L.mapbox.marker.icon({
            'marker-size': 'large',
            'marker-symbol': 'circle',
            'marker-color': '#fbb038'
        });

        var marker = L.marker(new L.LatLng(coords[0], coords[1]), {
            alt: businessObject.businessName,
            riseOnHover: true,
            icon: icon
        });

        return marker;

    }
}

function showDetailMarker(businessObject) {
    clusterGroupMarkers.clearLayers();
    plainGroupMarkers.clearLayers();
    oms.clearMarkers();

    var marker = createBusinessMarker(businessObject);
    if (marker) { //marker may not be created if coords don't exist
        var popupContent = businessDetailTemplate(businessObject);

        marker.bindPopup(popupContent, {
            closeButton: false,
            minWidth: 60
        });

        plainGroupMarkers.addLayer(marker);
        clusterGroupMarkers.addLayer(marker);
        oms.addMarker(marker);
        map.setView(marker.getLatLng(), 15, {
            animate: true,
            pan: {
                duration: 0.5
            }
        });
        setTimeout(function () {
            marker.openPopup();
        }, 600);

    }

}

function updateDisplay() {

    var entryContainer = $('#entry_container');

    //reset display

    clusterGroupMarkers.clearLayers();
    plainGroupMarkers.clearLayers();
    oms.clearMarkers();
    lastTapped = null;
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

            var marker = createBusinessMarker(businessObject);
            if (marker) { //marker may not be created if coords don't exist
                var popupContent = businessObject.businessName;

                marker.bindPopup(popupContent, {
                    closeButton: false,
                    closeOnClick: false
                });

                plainGroupMarkers.addLayer(marker);
                clusterGroupMarkers.addLayer(marker);
                oms.addMarker(marker);
            }
        });

        $(".business_entry").mouseenter(function (e) {

            if (currentSelected) return;

            var title = $(e.target).find("h4").text();
            plainGroupMarkers.eachLayer(function (marker) {
                if (marker.options.alt == title) {
                    marker.openPopup();
                } else {
                    marker.closePopup();
                }
            });
        }).click(function (e) {

            var title = $(e.currentTarget).find("h4").text();

            $(".business_entry").removeClass("business_entry_active");

            if (currentSelected && currentSelected == title) {
                currentSelected = null;
                //remove class
                resetZoom();
                updateDisplay();
                plainGroupMarkers.eachLayer(function (marker) {
                    if (marker.options.alt == title) {
                        marker.openPopup();
                    } else {
                        marker.closePopup();
                    }
                });
                return;
            } else {
                $(e.currentTarget).toggleClass("business_entry_active");
                currentSelected = title;

                //scrolls to top for when we're in mobile
                $('html, body').stop().animate({
                    scrollTop: 0
                }, 1500, 'easeInOutExpo');
            }

            var businessObject = businessStore[title];

            showDetailMarker(businessObject);

        });

    } else {

        $.map(tourStore, function (tourObject) {

            if (searchValue.length > 0) {
                var found = false;
                if (tourObject.tourGroupName.toLowerCase().indexOf(searchValue) > -1) {
                    found = true;
                }
                tourObject.stops.forEach(function (tourStop) {
                    if (tourStop.tourGuide.toLowerCase().indexOf(searchValue) > -1) {
                        found = true;
                    }
                    if (tourStop.business && tourStop.business.businessName.toLowerCase().indexOf(searchValue) > -1) {
                        found = true;
                    }
                });

                if (!found) return;
            }


            // iterate through objects and add to display

            entryContainer.append(tourTemplate(tourObject));

            tourObject.stops.forEach(function (tourStop) {

                if (tourStop.business == undefined) return;

                var coords = $(tourStop.business.venueCoordinates);
                if (coords.length == 2 && ($.isNumeric(coords[0]) && $.isNumeric(coords[1]))) {

                    var icon = L.mapbox.marker.icon({
                        'marker-size': 'large',
                        'marker-symbol': 'circle',
                        'marker-color': tourObject.color
                    });

                    var marker = L.marker(new L.LatLng(coords[0], coords[1]), {
                        title: tourStop.business.businessName,
                        riseOnHover: true,
                        icon: icon
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
function focusIfDesktop() {
    if (!isMobile.any()) $('#search').focus();
}

function fetchTours() {


    var tourSpreadsheetCallback = function (error, options, response) {

        if (error) {
            console.log(error);
        } else {

            var count = -1;
            response.rows.forEach(function (row) {
                //save as structured data

                var tourGroupName = row.cells["TourGroupName"];
                // Some bug in Sheetrock isn't skipping the header for some reason..
                if (tourGroupName == "TourGroupName") return;


                if ($.isNumeric(tourGroupName)) tourGroupName = "Tour Group " + tourGroupName;

                if (!tourStore.hasOwnProperty(tourGroupName)) {
                    count++;
                    //initialize property if doesn't exist yet
                    tourStore[tourGroupName] = {
                        "bus": row.cells["Bus"],
                        "tourGroupName": tourGroupName,
                        "color": distinctColors[count],
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


    L.mapbox.accessToken = 'pk.eyJ1IjoibWxha2U5MDAiLCJhIjoiSXV0UEF6dyJ9.8ZrYcafYb59U67LHErUegw';
    map = L.mapbox.map('map', 'mlake900.lae6oebe', {
        zoomControl: true,
        closePopupOnClick: false

    });

    map.setView([38.032, -78.492]);

    resetZoom();

    //map.dragging.disable();
    //map.touchZoom.disable();
    //map.doubleClickZoom.disable();

    oms = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true
    });

    oms.addListener('click', function (marker) {
        console.log('test');


        if (isMobile.any() && lastTapped != marker.options.alt) {
            marker.openPopup();
            lastTapped = marker.options.alt;
            return;
        }


        if (currentSelected){
            currentSelected = null;
            resetZoom();
            updateDisplay();
            setTimeout(function(){
                plainGroupMarkers.eachLayer(function (marker) {
                    if (marker.options.alt == title) {
                        marker.openPopup();
                    } else {
                        marker.closePopup();
                    }
                });
            }, 550);

            return;
        }

        currentSelected = marker.options.alt;

        if (businessTabSelected){
            var businessObject = businessStore[marker.options.alt];
            showDetailMarker(businessObject);
        }


    });

    map.scrollWheelZoom.disable();
    map.zoomControl.setPosition('bottomleft');

    map.on('zoomend', function () {
        setActiveLayers();
    });

    setActiveLayers();
    //TODO: L.control.fullscreen({position: "topright"}).addTo(map);


    businessTemplate = Handlebars.compile($('#business_template').html());
    tourTemplate = Handlebars.compile($('#tour_template').html());
    businessDetailTemplate = Handlebars.compile($('#popup_business_detail_template').html());

    var businessSpreadsheetCallback = function (error, options, response) {

        if (error) {
            console.log(error);
        } else {
            response.rows.forEach(function (row) {
                //save as structured data

                var website = row.cells["Website"];

                if (website && website.length > 1) {
                    if (website.toLowerCase().indexOf("http") == -1) website = "http://" + website;
                } else {
                    website = null;
                }

                businessStore[row.cells["Name"]] = {
                    "businessName": row.cells["Name"],
                    "businessWebsite": website,
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

    focusIfDesktop();

    plainGroupMarkers.on('mouseover', function (e) {
        e.layer.openPopup();
    });


});


var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};