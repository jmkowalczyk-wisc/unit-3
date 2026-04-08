// Self-executing anonymous function, moves everything to local scope for performance reasons
(function(){
    
    // Pseudo-global variables, technically local because the entire script is wrapped in one anonymous function.
    // Variables from the BRIC data to join to the county data
    var attrArray = ["SOCIAL", "ECONOM", "HOUSING/INFRA", "COMM CAPITAL", "INSTITUTIONAL", "ENVIRONMENT"];
    // Object containing different expressed variables
    var expressed = {
        x: attrArray[2], // x attribute
        y: attrArray[0], // y attribute
        color: attrArray[1] // Color and size attribute
    }

    // Start script once window loads
    window.onload = initMap();

    // Initialize choropleth map
    function initMap() {
        // Dimensions of map frame
        var width = window.innerWidth * 0.5 - 25, // Reads the internal width of the browser frame
            height = 460;

        // SVG container for map
        var map = d3.select('body')
            .append('svg')
            .attr('class', 'map')
            .attr('width', width)
            .attr('height', height);
        
        // Projection Generator - Equal Area needed for choropleth map, centered on Illinois
        var projection = d3.geoAlbers()
            .center([0, 39.77]) // Coordinates of the center of the projection
            .rotate([90.09, 0, 1]) // Longitude, Latitude, and roll angles for the reference globe
            .parallels([37.45, 42.22]) // Conic projections need two standard parallels, specifies them
            .scale(4600) // Map scale, 1:X
            .translate([width / 2, height / 2]) // Offsets pixel coordinates in the SVG container.

        // GeoPath generator, takes a given geojson and generates repsective SVG path data.
        var path = d3.geoPath().projection(projection)

        // Sets up a data array for use in Promise.all()
        // d3.x() methods are AJAX methods, like fetch() from Lab 1
        var promises = [
            d3.csv('data/bric2020_il.csv'),
            d3.json('data/IL_bordershapes.topojson'),
            d3.json('data/IL_counties.topojson')
        ];
        // Promise.all allows loading multiple data sources asynchronously, takes an array of data.
        // Promise.all can then chain into a single callback function for all data sources.
        Promise.all(promises).then(callback);

        // callback() is included in initMap() to use local variables.
        function callback(data) {
            // Assigning variables to handle all three data files
            var csvData = data[0],
                borderData = data[1],
                countyData = data[2];
            
            // Using topojson.feature() to translate .topojson data to .geojson, d3 needs .geojson to map.
            // (var, var.objects.XXX) is the parameter format for topojson.feature(), XXX is the name of the topojson to be converted.
            var borderStates = topojson.feature(borderData, borderData.objects.IL_bordershapes),
                countyShapes = topojson.feature(countyData, countyData.objects.IL_counties).features;

            // Adding the border states to the map. This acts like a base map without interactivity.
            var states = map
                .append('path') // map is already an <svg> element, this adds a <path> to it.
                .datum(borderStates) // .datum() is used here to create a reference layer that doesn't need interaction
                .attr('class', 'states')
                .attr('d', path); // 'd' contains the data for a path. It takes the place of r, cx, and cy for circles, or other similar parameters.

            countyShapes = joinData(countyShapes, csvData); // Joins BRIC csv data to county topoJSON

            var colorScale = makeColorScale(csvData) // Generates the color scale given the data in csvData

            setEnumerationUnits(countyShapes, map, path, colorScale); // Adds individually interactable counties to the map.

            setChart(csvData, colorScale);
        }
    }

    // Creates the supplementary coordinated bubble chart
    function setChart (csvData, colorScale){
        // Dimensions
        var chartWidth = window.innerWidth * 0.5 - 25, // Reads the internal width of the browser frame
            chartHeight = 460;
        
        // Create svg element to hold the bubble chart
        var chart = d3.select('body')
            .append('svg')
            .attr('width', chartWidth)
            .attr('height', chartHeight)
            .attr('class', 'chart');

        // Create scale to place circles proportionally on y-axis
        var yScale = d3.scaleLinear()
            .range([chartHeight, 0]) // Bound of yScale's output
            .domain([0, 1]) // Bound of yScale's input
        // Likewise, but for x axis
        var xScale = d3.scaleLinear()
            .range([0,chartWidth])
            .domain([0, 1])
        // Because every value passed to the setChart function is below 1, a d3 scale is needed to scale the circles properly.
        var radiusScale = d3.scalePow()
            .exponent(0.5715) // Flannery scaling exponent
            .domain([0, d3.max(csvData, function(d){ // Sets the maximum of the domain to the highest value found in the expressed color variable
                return parseFloat(d[expressed.color]);
            })])
            .range([1, 7]) // Minimum and maximum circle radius

        // Create axes generators
        var yAxisScale = d3.axisRight().scale(yScale);
        var xAxisScale = d3.axisTop().scale(xScale);

        // Place Axes
        var yaxis = chart.append('g')
            .attr('class', 'yaxis')
            .call(yAxisScale);

        var xaxis = chart.append('g')
            .attr('class', 'xaxis')
            .attr('transform', 'translate(0,' + chartHeight + ')')
            .call(xAxisScale);

        // Create circles for each county
        var circles = chart.selectAll('.circles') // Empty selection inside of the chart container
            .data(csvData) // Give the chart function the data in the csv
            .enter() // Needed for d3 to process the previous line
            .append('circle') // Append a circle for each entry in csvData, should be ~100 circles
            .attr('class', 'circles')
            .attr('class', function(d){ // Adds two more classes to each circle, bubble and the name of the county
                return 'bubble ' + d.County;
            })
            .attr('r', function(d){ // Varies the size of the bubbles based on the expressed color variable
                return radiusScale(parseFloat(d[expressed.color]));
            })
            .attr('cx', function(d, i){ // Varies the x position of the bubbles based on the expressed x variable
                return xScale(parseFloat(d[expressed.x]));
            })
            .attr('cy', function(d){ // Varies the y position of the bubbles based on the expressed y variable
                return yScale(parseFloat(d[expressed.y]));
            })
            .attr('fill', function(d){ // Varies the color of the bubbles based on the expressed color variable
                return colorScale(parseFloat(d[expressed.color]));
            });
    };

    // Joins BRIC csv data to the county topojson
    function joinData(countyShapes, csvData) {
        // Loop through BRIC data to assign each set of CSV attribute values to the topojson counties
        // First loop iterates through the BRIC csv's rows.
        for (var i = 0; i < csvData.length; i++) {
            var csvCounty = csvData[i]; // Keeps track of which county is currently being read
            var csvKey = csvCounty.GEOID; // BRIC primary key

            // Second loop iterates through the topojson to find the respective county that matches the BRIC csv row
            for (var a = 0; a < countyShapes.length; a++) {
                var countyProps = countyShapes[a].properties; // Current county properties
                var countyKey = countyProps.CODE_LOCAL; // County topojson primary key
                
                // Where primary keys match, transfer the BRIC data to the topojson properties
                if (countyKey == csvKey) {
                    // Assign attributes and values
                    attrArray.forEach(function (attr) { // For each object attr in attrArray...
                        var val = parseFloat(csvCounty[attr]); // Get the csv attribute value
                        countyProps[attr] = val; // Assign attribute and value to topojson properties
                    });
                }
            }
        }
        return countyShapes;
    }

    // Creates color scale generator
    function makeColorScale(data) {
        // Establish array of colors to be iterated between
        var colorClasses = [             
            '#ffffcc',
            '#c2e699',
            '#78c679',
            '#31a354',
            '#006837' 
        ];
        // Creates the d3 generator for the scale
        var colorScale = d3.scaleQuantile()
            .range(colorClasses); // Maximum range of the scale's output, i.e., can only output within the five values set in colorClasses

        // Build array of all values of the currently expressed attribute
        var domainArray = [];
        for (var i = 0; i < data.length; i++) { // For each row i in the provided data...
            var val = parseFloat(data[i][expressed.color]) // Converts the string data in the current row and expressed attribute to a float
            domainArray.push(val); // Adds the current float from the loop to the end of domainArray
        };

        // Assign array of expressed values of as the domain of the scale
        colorScale.domain(domainArray);

        // Return the completed color scale
        return colorScale
    };

    function setEnumerationUnits(countyShapes, map, path, colorScale) {
        // Adding counties to the maps. These need to be individually interactable.
        var counties = map
            .selectAll('.counties') // Creates empty selection by selecting a class ahead of its creation
            .data(countyShapes) // .data is used to create independent <svg> elements for each county.
            .enter() // Needed to process the data
            .append('path') // Adds a <path> element to the existing <svg> element in map
            .attr('class', function(d){ // Adds two classes to each feature: counties, which is selected earlier, and the name of the county.
                return "counties " + d.properties.COUNTYNAME;
            })
            .attr('d', path) // Adds path data.
            .style('fill', function(d){ // Sets the fill color based on the color scale established earlier.
                var value = d.properties[expressed.color]; // Stores the value of a county's expressed variable
                if (value) { // If a county's expressed variable exists...
                    return colorScale(d.properties[expressed.color]) // Color the county based on the color scale
                } else { // If a county's expressed variable does not exist...
                    return '#ccc' // Color the county light gray.
                }
            });
    }

})(); // Must always be the last line. Closes and executes the anonymous function wrapping main.json