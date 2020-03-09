"use-strict";

let width = 700,
    height = 580;

const small_msm = {
    width: 600,
    height: 300,
    marginAll: 50,
}

let data_total = "";
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

    albersProjection = d3.geoAlbers()
    .scale( 800 )
    .rotate( [-104.1954,0] )
    .center( [0, 35.8617] )
    .translate( [width/2,height/2] );

    let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let toolChart = div.append('svg')
        .attr('width', small_msm.width)
        .attr('height', small_msm.height)

    let provinces = svg.append( "g" ).attr( "id", "province" );
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
            toolChart.selectAll("*").remove()
            div.transition()
                .duration(200)
                .style("opacity", 0.9);
            let province = d["Province/State"];
            plotLinechart(province,toolChart)
            div.style("left", (d3.event.pageX) + "px")
               .style("top", (d3.event.pageY + 20) + "px");
        })
        .on("mouseout", (d) => {
            div.transition()
                .duration(500)
                .style("opacity", 0)
        })
}

function plotLinechart(province, toolChart) {
    // parse the date / time
    let parseTime = d3.timeParse("%m/%d/%Y %H:%M:%S");

    // set the ranges
    let x = d3.scaleTime().range([0 + small_msm.marginAll, small_msm.width - small_msm.marginAll]);
    let y = d3.scaleLinear().range([0 + small_msm.marginAll, small_msm.height - small_msm.marginAll]);

    // define the 1st line
    let recoveredLine = d3.line()
                      .x(function(d) { return x(d.Date); })
                      .y(function(d) { return y(d.Recovered); });

    // define the 2nd line
    let confirmedLine = d3.line()
                      .x(function(d) { return x(d.Date); })
                      .y(function(d) { return y(d.Confirmed); });

    d3.csv("2019_nCoV_data.csv", function(error, data) {
      if (error) throw error;

      let data_province = data.filter((data) => {return data["Province/State"] == province });

      data_province.forEach(function(d) {
        d.Date = parseTime(d.Date);
        d.Recovered = +d.Recovered;
        d.Confirmed = +d.Confirmed;
      });

      x.domain(d3.extent(data_province, function(d) { return d.Date; }));
      y.domain([d3.max(data_province, function(d) { return Math.max(d.Recovered, d.Confirmed); }) , 0]);

      toolChart.append("path")
         .datum(data_province)
         .attr("fill", "none")
         .attr("stroke", "green")
         .attr("stroke-width", 1.5)
         .attr("class", "line")
         .attr("d", recoveredLine);

      toolChart.append("path")
         .datum(data_province)
         .attr("fill", "none")
         .attr("class", "line")
         .style("stroke", "red")
         .attr("stroke-width", 1.5)
         .attr("d", confirmedLine);

      toolChart.append("g")
          .attr("transform", "translate(0," + (small_msm.height - small_msm.marginAll) + ")")
          .call(d3.axisBottom(x));

      toolChart.append("g")
          .attr('transform', 'translate(' + small_msm.marginAll + ', 0)')
          .call(d3.axisLeft(y));

      makeLabels(toolChart, small_msm, "Recovered(Green) vs. Confirmed(Red)", "Date", "Count Number");
    })
}

function makeLabels(svgContainer, msm, title, x, y) {
  svgContainer.append('text')
      .attr('x', (msm.width - 5 * msm.marginAll) / 2)
      .attr('y', msm.marginAll / 2 + 10)
      .style('font-size', '10pt')
      .text(title);

  svgContainer.append('text')
      .attr('x', (msm.width - 0.5 * msm.marginAll) / 2 - 30)
      .attr('y', msm.height - 10)
      .style('font-size', '10pt')
      .text(x);

  svgContainer.append('text')
      .attr('transform', 'translate( 15,' + (msm.height / 2 + 30) + ') rotate(-90)')
      .style('font-size', '10pt')
      .text(y);
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
