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

var tourLayers = new L.LayerGroup();

var map;

var oms;

var businessStore = {};

var tourStore = {};

var businessTemplate;

var businessDetailTemplate;

var basicPopupTemplate;

var tourTemplate;

var currentSelected = null;

var lastTapped = null;

var businessTabSelected = true;

var distinctColors = [
    "#fbb038","#f57f17","#f44336","#d32f2f","#d81b60","#ad1457","#6a1b9a","#673ab7","#4527a0","#3f51b5",
    "#303f9f","#2196f3","#1976d2","#01579b","#00bcd4","#0097a7","#006064","#009688","#004d40","#4caf50",
    "#388e3c","#33691e","#c0ca33","#9e9d24","#ff7043","#bf360c","#795548","#5d4037","#9e9e9e","#424242",
    "#607d8b","#37474f","#fdd835","#ff4081"];

var center = [38.032, -78.492];

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
        event.preventDefault();
        var searchField = $('#search');
        searchField.val("");
        focusIfDesktop();
        resetZoom();
        map.setView(center);
        currentSelected = null;

        if ($(event.target).hasClass("active_tab")){
            updateDisplay();
            return;
        }

        $('.selection_container li').toggleClass("active_tab");
        businessTabSelected = !businessTabSelected;
        if (businessTabSelected) {
            window.location = "#tab=businesses";
            searchField.attr("placeholder", "Search businesses..")
        } else {
            window.location = "#tab=tours";
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

        //show viewer higher up to accommodate popup
        var raisedLatLng = L.latLng(marker.getLatLng().lat +.002, marker.getLatLng().lng);
        map.setView(raisedLatLng, 15, {
            animate: true,
            pan: {
                duration: 0.5
            }
        });
        setTimeout(function () {


            marker.openPopup();
            $('.directions_link').on('click', function(e){

                //using maps.google.com will
                var venueCoordinates = e.currentTarget.href.substring(49,e.currentTarget.href.length);
                if(isMobile.iOS()){
                    e.preventDefault();
                    window.location.href = "http://maps.apple.com/maps?saddr=Current%20Location&daddr=" + venueCoordinates;
                }
            });

        }, 600);



    }

}

function updateDisplay() {

    var entryContainer = $('#entry_container');

    //reset display

    clusterGroupMarkers.clearLayers();
    plainGroupMarkers.clearLayers();
    oms.clearMarkers();
    tourLayers.clearLayers();
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
                var popupContent = basicPopupTemplate(businessObject);

                marker.bindPopup(popupContent, {
                    closeButton: false,
                    closeOnClick: false,
                    autoPan: false
                });

                plainGroupMarkers.addLayer(marker);
                clusterGroupMarkers.addLayer(marker);
                oms.addMarker(marker);
            }
        });

        $(".business_entry").mouseenter(function (e) {

            if (currentSelected) return;

            var title = $(e.currentTarget).find("h4").text();
            plainGroupMarkers.eachLayer(function (marker) {
                if (marker.options.alt == title) {
                    map.panTo(marker.getLatLng(), {
                        animate: true,
                        duration: .50,
                        easeLinearity:.6
                    });
                    setTimeout(function(){
                        marker.openPopup();
                    }, 530);

                } else {
                    marker.closePopup();
                }
            });
        }).click(function (e) {

            var title = $(e.currentTarget).find("h4").text();
            lastTapped = title;
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

            tourObject.tourLayer = new L.FeatureGroup();

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

                    var popup = L.popup({
                        closeButton: false,
                        offset: new L.Point(0, -28),
                        autoPan: false
                    })
                        .setLatLng(new L.LatLng(coords[0], coords[1]))
                        .setContent(basicPopupTemplate(tourStop.business));

                    tourObject.tourLayer.addLayer(popup);

                    tourObject.tourLayer.addLayer(marker);
                    plainGroupMarkers.addLayer(marker);
                    clusterGroupMarkers.addLayer(marker);
                    oms.addMarker(marker);
                }

            });

        });

        //on mouseover of tourentry, simply iterate through tourobjects and add/remove what we're hoving over
        $(".tour_entry").mouseenter(function (e) {
            e.preventDefault();
            if (currentSelected) return;
            var title = $(e.currentTarget).find("h4").text();
            tourLayers.clearLayers();
            tourLayers.addLayer(tourStore[title].tourLayer);

        }).click(function(e){

            e.preventDefault();
            var title = $(e.currentTarget).find("h4").text();
            lastTapped = title;
            $(".tour_entry").removeClass("tour_entry_active");

            if (currentSelected && currentSelected == title) {
                currentSelected = null;

                var bounds = new L.LatLngBounds();
                $.map(tourStore, function (tourObject) {
                    var tourLayer = tourObject.tourLayer;
                    tourLayer.eachLayer(function (layer) {
                        if (layer instanceof L.Popup || layer instanceof L.Marker){
                            bounds.extend(layer.getLatLng());
                        }
                    });
                });
                map.fitBounds(bounds,{
                    paddingTopLeft:[50, 80]
                });
                updateDisplay();

                return;
            } else {
                $(e.currentTarget).toggleClass("tour_entry_active");
                currentSelected = title;

                var tourLayer = tourStore[title].tourLayer;
                if (!tourLayers.hasLayer(tourLayer)){
                    tourLayers.clearLayers();
                    tourLayers.addLayer(tourLayer);
                }

                var bounds = new L.LatLngBounds();
                tourLayer.eachLayer(function (layer) {
                    if (layer instanceof L.Popup || layer instanceof L.Marker){
                        bounds.extend(layer.getLatLng());
                    }
                });

                map.fitBounds(bounds,{
                    maxZoom: 15,
                    paddingTopLeft:[50, 80]
                });
                //scrolls to top for when we're in mobile
                $('html, body').stop().animate({
                    scrollTop: 0
                }, 1500, 'easeInOutExpo');
            }

            //var businessObject = businessStore[title];
            //
            //showDetailMarker(businessObject);

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

            var currentLocation = $.url(); //current page URL
            if (currentLocation.fparam("tab") == "tours"){
                $('.selection_container li')[1].click();
            }

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

    L.mapbox.accessToken = 'pk.eyJ1IjoibWxha2U5MDAiLCJhIjoiSXV0UEF6dyJ9.8ZrYcafYb59U67LHErUegw';
    map = L.mapbox.map('map', 'mlake900.lae6oebe', {
        zoomControl: true,
        closePopupOnClick: false

    });

    map.setView(center);

    resetZoom();

    //map.dragging.disable();
    //map.touchZoom.disable();
    //map.doubleClickZoom.disable();

    oms = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true
    });

    oms.addListener('click', function (marker) {

        if (isMobile.any() && lastTapped != marker.options.alt) {
            marker.openPopup();
            lastTapped = marker.options.alt;
            return;
        }
        lastTapped = marker.options.alt;

        if (currentSelected){
            //save marker to be opened after zooming out
            currentSelected = null;
            resetZoom();
            updateDisplay();
            setTimeout(function(){
                plainGroupMarkers.eachLayer(function (marker) {
                    if (marker.options.alt == lastTapped) {
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
    map.addLayer(tourLayers);

    businessTemplate = Handlebars.compile($('#business_template').html());
    tourTemplate = Handlebars.compile($('#tour_template').html());
    businessDetailTemplate = Handlebars.compile($('#popup_business_detail_template').html());
    basicPopupTemplate = Handlebars.compile($('#basic_popup_template').html());

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

    map.on('popupopen', function() {
        $('.basic_popup').click(function(e){
            var title = $(e.currentTarget).text();
            var businessObject = businessStore[title];
            currentSelected = title;
            showDetailMarker(businessObject);
        });
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