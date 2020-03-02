"use-strict";

var width = 700,
    height = 580;

let svg = "";
let chinageo = "";
let albersProjection = "";
let geoPath = "";
let confirmed = "";
let conScale = "";

window.onload = function () {
    svg = d3.select( "#graph" )
    .append( "svg" )
    .attr( "width", width )
    .attr( "height", height );

    chinageo = svg.append( "g" ).attr( "id", "chinageo");

    fetch("china.json")
    .then(res => res.json()) // res is returned from the above fetch
    .then(data => makeMap(data)); // data is returned from last .then

    d3.csv("cleaned_data.csv", function(data){
        let allcon = data.map((row) => parseInt(row["Confirmed"]));
        conScale = d3.scaleSqrt()
                    .domain([d3.min(allcon), d3.max(allcon)])
                    .range([3,30]);
        id("confirmed").addEventListener("change", function() {
            confirmed = this.value;
            filterData(data);
        });
        makeCircles(data);
    });
}

function makeMap(data) {
    china_json = data;
    albersProjection = d3.geoAlbers()
        .scale( 800 )
        .rotate( [-104.1954,0] )
        .center( [0, 35.8617] )
        .translate( [width/2,height/2] );
    geoPath = d3.geoPath()
        .projection( albersProjection );

    chinageo.selectAll( "path" )
        .data( china_json.features )
        .enter()
        .append( "path" )
        .attr("fill", "blue")
        .attr( "d", geoPath );

    // chinageo.selectAll( ".text" )
    // .attr('class', 'label')
    // .data( china_json.features )
    // .enter()
    // .append('text')
    // .attr('x', )
    // .attr('y', yMap)
    // .attr("fill", "black")
    // .attr( "d", geoPath );

}

function makeCircles(data) {
    d3.selectAll('circle').remove();
    let div = d3.select("#graph")
                    .append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0)
    albersProjection = d3.geoAlbers()
    .scale( 800 )
    .rotate( [-104.1954,0] )
    .center( [0, 35.8617] )
    .translate( [width/2,height/2] );
    var provinces = svg.append( "g" ).attr( "id", "province" );
    provinces.selectAll('.dot')
        .data( data )
        .enter()
        .append('circle')
        .attr( "cx", function(d){
            return albersProjection(new Array(d.longitude, d.latitude))[0];
        })
        .attr( "cy", function(d){
            return albersProjection(new Array(d.longitude, d.latitude))[1];
        })
        .attr('r', function(d) {
            return conScale(d.Confirmed);
        })
        .attr('fill', 'maroon')
        .attr('opacity', 0.5)
        .attr('stroke', 'lightgrey')
        // .on( "click", function(){
        //     d3.select(this)
        //     .attr("opacity",1)
        //     .transition()
        //     .duration( 1000 )
        //     .attr( "cx", width * Math.round( Math.random() ) )
        //     .attr( "cy", height * Math.round( Math.random() ) )
        //     .attr( "opacity", 0 )
        //     .on("end",function(){
        //         d3.select(this).remove();
        //     })
        // });
        .on("mouseover", (d) => {
            div.transition()
                .duration(200)
                .style("opacity", 0.9);
            let prompt = 'Confirmed: ' + d['Confirmed'] + '<br/>' + 'Death: ' + d['Death'] + '<br/>'
            + 'Recovered: ' + d['Recovered'] + '<br/>'
            + 'Last Update: ' + d['Last Update']
            div.html(prompt)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 20) + "px");
        })
        .on("mouseout", (d) => {
            div.transition()
                .duration(500)
                .style("opacity", 0)
        })
}

function id(name) {
    return document.getElementById(name);
}

function filterData(data) {
    // let currData;
    if (confirmed == 1) {
        currData = data.filter(function(d){ return d["Confirmed"] < 38 });
    } else if (confirmed == 2) {
        currData = data.filter(function(d){ return d["Confirmed"] >= 38 &&  d["Confirmed"] < 104 });
    } else if (confirmed == 3) {
        currData = data.filter(function(d){ return d["Confirmed"] >= 104 &&  d["Confirmed"] < 236 });
    } else if (confirmed == 4) {
        currData = data.filter(function(d){ return d["Confirmed"] >= 236});
    } else {
        currData = data;
    }
    makeCircles(currData)
}



