//// CONFIGURE
//// copy in the business spreadsheet url (be sure you're on the right tab and that the sheet is publicly "viewable")
var businessSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1P8042q3PfithAudtrIY5Ce6VbMc_zViIRB7tFQ_rUBg/#gid=1872708460';

var tourSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1P8042q3PfithAudtrIY5Ce6VbMc_zViIRB7tFQ_rUBg/edit#gid=1737014077';

///////////////////////////////////////////////////////////////////////////////////////////////////


//var clusterGroupMarkers = new L.MarkerClusterGroup({
//    showCoverageOnHover: false,
//    animateAddingMarkers: false,
//    maxClusterRadius: 35,
//    disableClusteringAtZoom: 13
//});

var plainGroupMarkers = new L.FeatureGroup();

var tourLayers = new L.LayerGroup();

var map;

var oms;

var businessStore = {};

var tourStore = {};

var businessTemplate;

var businessDetailTemplate;

var basicPopupTemplate;

var basicTourPopupTemplate;

var directionsSummaryTemplate;

var tourTemplate;

var currentSelected = null;

var hoverTimer = null;

var lastTapped = null;

var businessTabSelected = true;

var distinctColors = [
    "#fbb038","#f57f17","#f44336","#d32f2f","#d81b60","#ad1457","#6a1b9a","#673ab7","#4527a0","#3f51b5",
    "#303f9f","#2196f3","#1976d2","#01579b","#00bcd4","#0097a7","#006064","#009688","#004d40","#4caf50",
    "#388e3c","#33691e","#c0ca33","#9e9d24","#ff7043","#bf360c","#795548","#5d4037","#9e9e9e","#424242",
    "#607d8b","#37474f","#fdd835","#ff4081"];

var center = [38.032, -78.492];

var directionsDisplay;
var directionsService;
var directionsMap;


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

        currentSelected = null;

        if (!$(event.target).hasClass("active_tab")){
            $('.selection_container li').toggleClass("active_tab");
        }
        businessTabSelected = $(event.currentTarget)[0].innerHTML == "Businesses";


        if (businessTabSelected){
            window.location = "#tab=businesses";
            searchField.attr("placeholder", "Search businesses..");
            map.setView(center, getDefaultZoom());
        } else {
            window.location = "#tab=tours";
            searchField.attr("placeholder", "Search tours..");
        }
        updateDisplay();
        focusIfDesktop();

    });
});

$(function () {
    $('#search').keyup(function (event) {
        updateDisplay();
    });
});

function getDefaultZoom() {
    var zoomLevel = 14;
    if ($(window).width() < 550) zoomLevel = 12;
    return zoomLevel;
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

function showTourStopMarker(businessObject) {
    tourLayers.eachLayer(function (tourLayer) {
        tourLayer.eachLayer(function(layer){
            if (layer instanceof L.Popup ){
                tourLayer.removeLayer(layer);
            }
        });
    });
    showDetailMarker(businessObject);
}

function showDetailMarker(businessObject) {
    hideDirectionsDropDown();

    //clusterGroupMarkers.clearLayers();
    plainGroupMarkers.clearLayers();
    oms.clearMarkers();

    var marker = createBusinessMarker(businessObject);
    if (marker) { //marker may not be created if coords don't exist
        var popupContent = businessDetailTemplate(businessObject);

        marker.bindPopup(popupContent, {
            closeButton: false,
            minWidth: 60,
            offset: new L.Point(0, -30)
        });

        plainGroupMarkers.addLayer(marker);
        //clusterGroupMarkers.addLayer(marker);
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

                var origLink = e.currentTarget.href;
                //using maps.google.com will launch native app
                var venueCoordinates = origLink.substring(55);
                if(isMobile.iOS()){
                    e.preventDefault();
                    window.location.href = "comgooglemapsurl://" + origLink.substring(23);

                    setTimeout(function(){
                        window.location.href = origLink;
                    }, 600);

                    //window.location.href = "http://maps.apple.com/maps?saddr=Current%20Location&daddr=" + venueCoordinates;
                }
            });

        }, 600);
    }
}

function initMap() {

    directionsDisplay = new google.maps.DirectionsRenderer({
        suppressMarkers: false
        //markerOptions: {
        //    icon: {
        //        size: google.maps.Size(35,90),
        //        anchor: google.maps.Point(50, 45),
        //        url:"http://a.tiles.mapbox.com/v4/marker/pin-l-circle+fbb038.png?access_token=pk.eyJ1IjoibWxha2U5MDAiLCJhIjoiSXV0UEF6dyJ9.8ZrYcafYb59U67LHErUegw"
        //    }
        //}
    });

    directionsService = new google.maps.DirectionsService;

    directionsMap = new google.maps.Map(document.getElementById('directions-map'), {
        zoom: 7,
        center: {lat: center[0], lng: center[1]},
        scrollwheel: false,
        draggable: true,
        zoomControl: false,
        mapTypeControl: false,
        disableDefaultUI: true
    });


    directionsDisplay.setMap(directionsMap);
    directionsDisplay.setPanel(document.getElementById('directions-panel'));

    //var control = document.getElementById('floating-panel');
    //control.style.display = 'block';
    //map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);

    //calculateAndDisplayRoute(directionsService, directionsDisplay);
}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    var start = "Piedmont Virginia Community College, Charlottesville, VA 22902";
    var end = "Piedmont Virginia Community College, Charlottesville, VA 22902";

    var waypoints = [];

    var tourObject = tourStore[currentSelected];
    var directionsSummary = $("#directions-summary");
    directionsSummary.empty();
    if (tourObject){

        $("#groupname")[0].innerHTML= tourObject.tourGroupName;
        tourObject.stops.forEach(function (tourStop) {

            var venueName = tourStop.business.venueName;
            if (venueName && venueName.length < 2) venueName = tourStop.business.businessName;

            waypoints.push({
                location: tourStop.business.venueCoordinates[0] + "," + tourStop.business.venueCoordinates[1],
                stopover: true
            });
        });

        //modify the original tour object to include PVCC stops and add marker IDs

        var tourExtended = $.extend({}, tourObject);
        var markerArray = ["B","C","D","E","F","G","H"];
        var count = 0;
        tourExtended.stops.forEach(function (tourStop) {
            tourStop.markerId = markerArray[count++];
        });

        tourExtended.lastMarkerId = markerArray[count];
        directionsSummary.append(directionsSummaryTemplate(tourExtended));
    }

    directionsService.route({
        origin: start,
        destination: end,
        waypoints: waypoints,
        provideRouteAlternatives: false,
        travelMode: google.maps.TravelMode.DRIVING
    }, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
    google.maps.event.trigger(directionsMap,'resize');
}

function loadDirections() {
    $(".overlay").show();
    calculateAndDisplayRoute(directionsService, directionsDisplay);
}

function hideDirectionsDropDown(){
    $("#directions-dropdown").animate({top: '-38'}, "slow");
}

function updateDisplay() {
    console.log("updateDisplay();");
    var entryContainer = $('#entry_container');

    hideDirectionsDropDown();
    //reset display

    //clusterGroupMarkers.clearLayers();
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
                    autoPan: true,
                    offset: new L.Point(0, -30)
                });
                plainGroupMarkers.addLayer(marker);
                //clusterGroupMarkers.addLayer(marker);
                oms.addMarker(marker);
            }
        });

        $(".business_entry[name]").mouseenter(function (e) {

            if (currentSelected) return;

            if (isMobile.any()) return; // mouseenter on mobile fires before "click", even though there's no mouse
            clearTimeout(hoverTimer);
            var title = $(e.currentTarget).find("h4").text();
            plainGroupMarkers.eachLayer(function (marker) {
                if (marker.options.alt == title) {
                    map.panTo(marker.getLatLng(), {
                        animate: true,
                        duration: .50,
                        easeLinearity:.6
                    });

                    hoverTimer = setTimeout(function(){
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
                updateDisplay();
                plainGroupMarkers.eachLayer(function (marker) {
                    if (marker.options.alt == title) {
                        var zoomLevel = 14;
                        map.setView(marker.getLatLng(), zoomLevel);
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

        var bounds = new L.LatLngBounds();
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

                    var latLng = new L.LatLng(coords[0], coords[1]);

                    //markers & popups that are shown separately
                    var tourMarker = L.marker(latLng, {
                        alt: tourStop.business.businessName,
                        riseOnHover: true,
                        icon: icon
                    });
                    var tourPopup = L.popup({
                        closeButton: false,
                        offset: new L.Point(0, -30),
                        autoPan: false
                    })
                        .setLatLng(latLng)
                        .setContent(basicTourPopupTemplate(tourStop));

                    //initial set of markers which can be explored
                    var plainMarker = L.marker(latLng, {
                        alt: tourStop.business.businessName,
                        riseOnHover: true,
                        zIndexOffset: -300,
                        icon: icon
                    });

                    var plainPopup = L.popup({
                        closeButton: false,
                        autoPan: false,
                        closeOnClick: true
                    })
                        .setLatLng(latLng)
                        .setContent(basicTourPopupTemplate(tourStop));

                    plainMarker.bindPopup(plainPopup, {
                        offset: new L.Point(0, -30)
                    });

                    plainMarker.on("click", function(e){
                        currentSelected = e.target.options.alt;
                        lastTapped = currentSelected;
                        var businessObject = businessStore[currentSelected];
                        showDetailMarker(businessObject);
                    });

                    tourMarker.on("click", function(e){

                        lastTapped = e.target.options.alt;
                        var businessObject = businessStore[lastTapped];
                        showTourStopMarker(businessObject);

                    });

                    tourObject.tourLayer.addLayer(tourPopup);
                    tourObject.tourLayer.addLayer(tourMarker);

                    plainGroupMarkers.addLayer(plainMarker);

                    bounds.extend(latLng);
                }
            });
        });
        map.fitBounds(bounds,{
            paddingTopLeft:[15, 10],
            paddingBottomRight:[-50, -50]
        });

        //on mouseover of tourentry, simply iterate through tourobjects and add/remove what we're hoving over
        $(".tour_entry[name]").mouseenter(function (e) {
            if (currentSelected) return;
            if (isMobile.any()) return; // mouseenter on mobile occurs before "click"
            var title = $(e.currentTarget).find("h4").text();
            tourLayers.clearLayers();
            tourLayers.addLayer(tourStore[title].tourLayer);
            plainGroupMarkers.bringToBack();
            tourStore[title].tourLayer.bringToFront();

        }).mouseleave(function (e){
                var title = $(this).find("h4").text();
                if (currentSelected != title){
                    var layer = tourStore[title].tourLayer;
                    if (tourLayers.hasLayer){
                        tourLayers.removeLayer(layer);
                    }
                }
            }
        ).click(function(e){

            var title = $(e.currentTarget).find("h4").text();
            lastTapped = title;
            $(".tour_entry").removeClass("tour_entry_active");

            if (currentSelected && currentSelected == title) {
                currentSelected = null;
                updateDisplay();
            } else {
                $(this).toggleClass("tour_entry_active");
                currentSelected = title;
                plainGroupMarkers.clearLayers();
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

                $(".tour_time").show();

                setTimeout(function(){
                    map.fitBounds(bounds,{
                        maxZoom: 15,
                        paddingTopLeft:[50, 120],
                        paddingBottomRight:[50, 20]
                    });


                }, 120);

                if (!isMobile.any()){
                    setTimeout(function(){
                        $("#directions-dropdown").animate({
                            top:'0'
                        }, 'slow');
                    }, 700);
                }

                //scrolls to top for when we're in mobile
                $('html, body').stop().animate({
                    scrollTop: 0
                }, 1500, 'easeInOutExpo');
            }

        });
    }
}

function setActiveLayers() {
    //if (map.getZoom() < 9 && map.hasLayer(clusterGroupMarkers)) {
    //    map.removeLayer(clusterGroupMarkers);
    //}
    //if (map.getZoom() >= 9 && map.hasLayer(clusterGroupMarkers) == false) {
    //    map.addLayer(clusterGroupMarkers);
    //}
}
function focusIfDesktop() {
    if (!isMobile.any()) $('#search').focus();
}

function fetchTours() {


    var tourSpreadsheetCallback = function (error, options, response) {

        if (error) {
            console.log(error);
            if(!alert('Network connectivity error. Press OK to refresh.')){window.location.reload();}
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
                        "tourGroupName": tourGroupName,
                        "color": distinctColors[0],
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
        sql: "select * ORDER BY B,C",
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

    map.setView(center, getDefaultZoom());

    //map.dragging.disable();
    //map.touchZoom.disable();
    //map.doubleClickZoom.disable();

    oms = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true
    });

    oms.addListener('spiderfy', function(markers){
        var lastMarker = markers[markers.length - 1];
        lastTapped = lastMarker.options.alt;
        lastMarker.openPopup();
    });

    oms.addListener('click', function (marker) {

        if (isMobile.any() && lastTapped != marker.options.alt) {
            //marker.openPopup();
            lastTapped = marker.options.alt;
            return;
        }
        lastTapped = marker.options.alt;

        if (currentSelected){
            //save marker to be opened after zooming out
            currentSelected = null;
            map.setZoom(getDefaultZoom());
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
    map.addLayer(plainGroupMarkers);
    map.addLayer(tourLayers);

    businessTemplate = Handlebars.compile($('#business_template').html());
    tourTemplate = Handlebars.compile($('#tour_template').html());
    businessDetailTemplate = Handlebars.compile($('#popup_business_detail_template').html());
    basicPopupTemplate = Handlebars.compile($('#basic_business_popup_template').html());
    basicTourPopupTemplate = Handlebars.compile($('#basic_tour_popup_template').html());
    directionsSummaryTemplate = Handlebars.compile($('#directions_summary_template').html());

    var businessSpreadsheetCallback = function (error, options, response) {

        if (error) {
            if(!alert('Network connectivity error. Press OK to refresh.')){window.location.reload();}
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
                var venueAddress = row.cells["TourAddress"];

                var cvilleIndex = venueAddress.toLowerCase().indexOf("charlottesville");
                if (cvilleIndex > -1){
                    venueAddress = venueAddress.substring(0, cvilleIndex).replace(/^\s*,\s*|\s*,\s*$/g,'');
                }

                var venueName = row.cells["TourVenue"];

                var businessName = row.cells["Company"];
                if (businessName == venueName) venueName = null;

                businessStore[businessName] = {
                    "businessName": businessName,
                    "businessWebsite": website,
                    "venueName": venueName,
                    "venueAddress": venueAddress,
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
    plainGroupMarkers.on('mouseout', function (e) {
        if (!currentSelected) e.layer.closePopup();
    });

    map.on('popupopen', function(e) {

        $('.basic_tour_popup').click(function(e){
            var title = $(this).find(".business_title").text();
            //currentSelected = title;
            var businessObject = businessStore[title];
            showTourStopMarker(businessObject);
        });

        $('.basic_business_popup').click(function(e){
            var title = $(this).find(".business_title").text();
            var businessObject = businessStore[title];
            currentSelected = title;
            showDetailMarker(businessObject);
        });
    });

    $("#print-button").on('click', function(e){
        window.print();
    });

    $(".overlay").on('click', function(e){
        if(e.target != this) return;
        $(this).hide();
    });

    $("#directions-dropdown").on('click', function(e){
        loadDirections();
    });

    $("#print-close").on('click', function(e){
        $(".overlay").hide();
    });

    $(document).keyup(function(e) {
        if (e.keyCode == 27) { // escape key maps to keycode `27`
            $(".overlay").hide();
        }
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