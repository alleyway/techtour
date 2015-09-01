
//// CONFIGURE
//// copy in the business spreadsheet url (be sure you're on the right tab and that the sheet is publicly "viewable")
var businessSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1P8042q3PfithAudtrIY5Ce6VbMc_zViIRB7tFQ_rUBg/#gid=1872708460';

var tourSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1P8042q3PfithAudtrIY5Ce6VbMc_zViIRB7tFQ_rUBg/edit#gid=1872708460';

///////////////////////////////////////////////////////////////////////////////////////////////////

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

        $.map(businessStore, function(businessObject){
            // iterate through objects and add to display
            businessContainer.append(businessTemplate(businessObject));

            // add marker

        });

        //iterate through businesses
        //create marker icon, set color

    } else {
        //iterate through tours
        // create marker icon, set color
        //add marker
        //add handlebar template
    }

}


$(document).ready(function () {

    //tech tour map id: mlake900.nb1o1aik

    var zoomLevel = 14;
    if ($(window).width() < 550) zoomLevel = 12;

    L.mapbox.accessToken = 'pk.eyJ1IjoibWxha2U5MDAiLCJhIjoiSXV0UEF6dyJ9.8ZrYcafYb59U67LHErUegw';
    var map = L.mapbox.map('map', 'mlake900.lae6oebe', {
        zoomControl: true

    }).setView([38.032, -78.492], zoomLevel);
    //map.dragging.disable();
    //map.touchZoom.disable();
    //map.doubleClickZoom.disable();


    map.scrollWheelZoom.disable();
    map.zoomControl.setPosition('topright');

    //TODO: L.control.fullscreen({position: "topright"}).addTo(map);


    businessTemplate = Handlebars.compile($('#business_template').html());
    tourTemplate = Handlebars.compile($('#tour_template').html());


    var businessSpreadsheetCallback = function (error, options, response){

        if (error){
            console.log(error);
        } else {
            response.rows.forEach(function(row){
                //save as structured data

                var tourCoordArray = row.cells["TourGPS"].split(",");

                if ($.isNumeric(tourCoordArray[0]) && $.isNumeric(tourCoordArray[1])) {
                    row.cells["TourLat"] = tourCoordArray[0];
                    row.cells["TourLng"] = tourCoordArray[1];
                }

                businessStore[row.cells["Name"]] = {
                    "businessName" : row.cells["Name"],
                    "venueName": row.cells["TourVenue"],
                    "venueAddress": row.cells["TourAddress"],
                    "venueLat": row.cells["TourLat"],
                    "venueLng": row.cells["TourLng"]
                };
            });

            //finished processing spreadsheet rows
            updateDisplay();

            //TODO: call sheetrock to grab tours
        }
    };

    $('#business_container').sheetrock({
        url: businessSpreadsheet,
        headersOff: true,
        rowGroups: false,
        sql: "select * where D contains 'YES' order by A",
        callback: businessSpreadsheetCallback
    });

});



