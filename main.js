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




});



