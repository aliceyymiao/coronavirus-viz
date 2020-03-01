"use-strict";

var width = 700,
    height = 580;

let svg = "";
let nygeo = "";
let albersProjection = "";
let geoPath = "";

window.onload = function () {
    svg = d3.select( "body" )
    .append( "svg" )
    .attr( "width", width )
    .attr( "height", height );

    nygeo = svg.append( "g" ).attr( "id", "nygeo");

    fetch("nygeo.json")
    .then(res => res.json()) // res is returned from the above fetch
    .then(data => makeMap(data)); // data is returned from last .then

    d3.csv("data.csv", function(data){
        makeCircles(data);
    });
}

function makeMap(data) {
    nygeo_json = data;
    albersProjection = d3.geoAlbers()
        .scale( 70000 )
        .rotate( [71.057,0] )
        .center( [-2.9, 40.7] )
        .translate( [width/2,height/2] );
    geoPath = d3.geoPath()
        .projection( albersProjection );

    nygeo.selectAll( "path" )
        .data( nygeo_json.features )
        .enter()
        .append( "path" )
        .attr( "d", geoPath );
}

function makeCircles(data) {
    var airbnb = svg.append( "g" ).attr( "id", "airbnb" );
    airbnb.selectAll('.dot')
        .data( data )
        .enter()
        .append('circle')
        .attr( "cx", function(d){
            return albersProjection(new Array(d.longitude, d.latitude))[0];
        })
        .attr( "cy", function(d){
            return albersProjection(new Array(d.longitude, d.latitude))[1];
        })
        .attr('r', 3)
        .attr('fill', 'steelblue')
        .on( "click", function(){
            d3.select(this)
            .attr("opacity",1)
            .transition()
            .duration( 1000 )
            .attr( "cx", width * Math.round( Math.random() ) )
            .attr( "cy", height * Math.round( Math.random() ) )
            .attr( "opacity", 0 )
            .on("end",function(){
                d3.select(this).remove();
            })
        });
}


