// Self-executing anonymous function, moves everything to local scope for performance reasons
(function(){
    
    // Pseudo-global variables, technically local because the entire script is wrapped in one anonymous function.
    // Variables from the BRIC data to join to the county data
    var attrObjects = [
        {attr:"SOCIAL", label:'Social Resilience Index'}, 
        {attr:"ECONOM", label:'Economic Resilience Index'}, 
        {attr:"HOUSING/INFRA", label:'Infrastructure/Housing Resilience Index'}, 
        {attr:"COMM CAPITAL", label:'Community Capacity Resilience Index'}, 
        {attr:"INSTITUTIONAL", label:'Institutional Resilience Index'}, 
        {attr:"ENVIRONMENT", label:'Environmental/Natural Resilience Index'}
    ];
    // Object containing different expressed variables
    var expressed = {
        x: attrObjects[2].attr, // x attribute
        y: attrObjects[0].attr, // y attribute
        color: attrObjects[1].attr // Color and size attribute
    }
    // Chart frame dimensions
    // window.innerWidth reads the internal width of the browser frame
    // Checking width of the screen, if over 700px, creates chart container with the width of the screen
    if (window.innerWidth < 700) { // If screen width is less than 700 px (i.e., phone screen)...
        var chartWidth = window.innerWidth - 40
    } else { // Otherwise...
        var chartWidth = window.innerWidth * 0.5 - 55
    }
       
    var chartHeight = window.innerHeight - 170;

    // Start script once window loads
    window.onload = initMap();

    // Initialize choropleth map
    function initMap() {
        // Dimensions of map frame
    if (window.innerWidth < 700) { // If screen width is less than 700 px (i.e., phone screen)...
        var width = window.innerWidth - 40
    } else { // Otherwise...
        var width = window.innerWidth * 0.5 - 55
    }

    var height = window.innerHeight - 170;

        // SVG container for map
        var map = d3.select('#mapchart-container') // Selecting 'body' causes the chart to appear at the very end of the html, after any other html. Putting the map and the chart in their own div fixes this.
            .append('svg')
            .attr('class', 'map')
            .attr('width', width)
            .attr('height', height);
        
        // Projection Generator - Equal Area needed for choropleth map, centered on Illinois
        var projection = d3.geoAlbers()
            .center([0, 39.77]) // Coordinates of the center of the projection
            .rotate([90.09, 0, 1]) // Longitude, Latitude, and roll angles for the reference globe
            .parallels([37.45, 42.22]) // Conic projections need two standard parallels, specifies them
            .scale(7750) // Map scale, 1:X
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

            setChart(csvData, colorScale); // Creates the bubble chart
            createTitle();
            createDropdown(csvData, 'color', 'Select Color/Size Index:');
            createDropdown(csvData, 'x', 'Select X Index:');
            createDropdown(csvData, 'y', 'Select Y Index:');
        }
    }

    // Calculate minimum and maximum values for expressed variables, used in scale functions
    function getDataValues(csvData, expressedValue) {
        var max = d3.max(csvData, function(d){ // Max value
            return parseFloat(d[expressedValue])
        });
        var min = d3.min(csvData, function(d){ // Min value
            return parseFloat(d[expressedValue])
        });
        var range = max - min,
            adjustment = range / csvData.length // Offset so no circles are cut off by the scale.
        return [min-adjustment, max + adjustment]
    }
    // Create y scale
    function createYScale(csvData, chartHeight) {
        var dataMinMax = getDataValues(csvData, expressed.y) // Calculate minimums and maximums
        return yScale = d3.scaleLinear().range([0, chartHeight]).domain([dataMinMax[1], dataMinMax[0]]); // Creates scale generator
    }
    // Create x scale
    function createXScale(csvData, chartWidth) {
        	var dataMinMax =  getDataValues(csvData, expressed.x) // Calculate minimums and maximums
            return xScale = d3.scaleLinear().range([0, chartWidth]).domain([dataMinMax[0], dataMinMax[1]]); // Creates scale generator
    }

    // Because every value passed to the setChart function is below 1, a d3 scale is needed to scale the circles properly.
    // Create color scale
    function createColorScale(csvData) {
        var dataMinMax = getDataValues(csvData, expressed.color) // Calculate minimums and maximums
        return colorScale = d3.scalePow().exponent(0.5715).range([5, 10]).domain([dataMinMax[0], dataMinMax[1]]) // Creates power scale generator, includes Flannery scaling
    }

    // Create chart axes
    function createChartAxes (chart, chartHeight, yScale, xScale) {
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
    }

    // Creates the supplementary coordinated bubble chart
    function setChart (csvData, colorScale){
        // Create svg element to hold the bubble chart
        var chart = d3.select('#mapchart-container') // Selecting 'body' causes the chart to appear at the very end of the html, after any other html. Putting the map and the chart in their own div fixes this.
            .append('svg')
            .attr('width', chartWidth)
            .attr('height', chartHeight)
            .attr('class', 'chart');

        // Create scale to place circles proportionally on the axes, and to color and resize them correctly.
        var yScale = createYScale(csvData, chartHeight);
        var xScale = createXScale(csvData, chartWidth);
        var radiusScale = createColorScale(csvData);

        // Add chart axes to chart
        createChartAxes(chart, chartHeight, yScale, xScale);

        // Create circles for each county
        var circles = chart.selectAll('.circles') // Empty selection inside of the chart container
            .data(csvData) // Give the chart function the data in the csv
            .enter() // Needed for d3 to process the previous line
            .append('circle') // Append a circle for each entry in csvData, should be ~100 circles
            .attr('class', 'circles')
            .attr('class', function(d){ // Adds two more classes to each circle, bubble and the name of the county
                return 'bubble ' + d.County.replace(/ /g, '-'); // Replaces spaces in county names with hyphens, to condense two-word counties to one class.
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
            })
            .on("mouseover", function (event, d) {
                d.COUNTYNAME = d.County // Name of county is COUNTYNAME in the topojson, but County in the csv. Setting d.COUNTYNAME equal to d.County fixes this.
                highlight(d); 
            })
            .on("mouseout", function (event, d) {
                d.COUNTYNAME = d.County // Name of county is COUNTYNAME in the topojson, but County in the csv. Setting d.COUNTYNAME equal to d.County fixes this.
                dehighlight(d); 
            })
            .on('mousemove', moveLabel);
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
                    attrObjects.forEach(function (attr) { // For each object attr in attrObjects...
                        var val = parseFloat(csvCounty[attr.attr]); // Get the csv attribute value
                        countyProps[attr.attr] = val; // Assign attribute and value to topojson properties
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
                return "counties " + d.properties.COUNTYNAME.replace(/ /g, '-'); // Replaces spaces in county names with hyphens, to condense two-word counties to one class.
            })
            .attr('d', path) // Adds path data.
            .style('fill', function(d){ // Sets the fill color based on the color scale established earlier.
                var value = d.properties[expressed.color]; // Stores the value of a county's expressed variable
                if (value) { // If a county's expressed variable exists...
                    return colorScale(d.properties[expressed.color]) // Color the county based on the color scale
                } else { // If a county's expressed variable does not exist...
                    return '#ccc' // Color the county light gray.
                }
            })
            .on('mouseover', function (event, d) { // When an enumeration unit is hovered over...
                highlight(d.properties); // Pass its properties to the highlight() function, without passing the whole GeoJSON feature
            })
            .on('mouseout', function(event, d) { // When the cursor leaves an enumeration unit...
                dehighlight(d.properties); // Pass its properties to the dehighlight() function, without passing the whole GeoJSON feature
            })
            .on('mousemove', moveLabel);
    }

    // Create page title
    function createTitle() {
        var pagetitle = d3.select('.navbar') // Places title inside the navbar div
            .append('h1') // Adds header 1 as the html tag
            .attr('class', 'pageTitle')
            .text('Baseline Resilience Indicators for Communities Dashboard')

        var subtitle = d3.select('.navbar')
            .append('h2')
            .attr('class', 'pageSubtitle')
            .text('by Joseph Kowalczyk, last updated 4/17/26')
    }

    // Create dropdown meny for attribute selection
    function createDropdown(csvData, expressedAttribute, menuLabel) {
        // Get dropdown label
        var dropdownLabel // Initialize variable
        attrObjects.forEach(function(x){ // For each object in attrObjects...
            if (expressed[expressedAttribute] == x.attr) {dropdownLabel = x.label} // If the expressed attribute = x's .attr attribute, set dropdown label equal to that object's label attribute.
        })
        // Add dropdown label
        var label = d3.select('.navbar')
            .append('p')
            .attr('class', 'dropdown-label')
            .text(menuLabel + ' ')
        
        // Add select element to initialize dropdown
        var dropdown = d3.select('.navbar') // Selects in navbar tag instead of below the map and chart
            .append('select') // Adds a <select> tag to the DOM, the basis of a dropdown menu
            .attr('class', 'dropdown') // Adds dropdown as the class for the element
            .on('change', function(){ // When the selected value of the dropdown menu changes...
                changeAttribute(this.value, expressedAttribute, csvData) // ...changes the map and chart to represent the selected attribute.
            });

        // Add initial option/entry point
        var titleOption = dropdown.append('option') // Adds <option> tags
            .attr('class', 'titleOption')
            .attr('disabled', 'true') // Ensures that this option cannot be selected
            .text('Select Attribute') // Text of initial option

        // Add attribute name options
        var attrOptions = dropdown.selectAll('attrOptions')
            .data(attrObjects) // Imports attribute strings to loop through for generating the options
            .enter() // Needed for .data()
            .append('option') // Adds an <option> tag to each item in the array
            .attr('value', function(d) {return d.attr}) // Sets the value of each option in the dropdown to the .attr attribute in the respective AttrOptions object
            .text(function(d) {return d.label}) // Likewise, but sets the displayed text for the option as the .label attribute.

        // Dropdown change event handler
        function changeAttribute(attribute, expressedAttribute, csvData) {
            // Set expressed attribute to the selected attribute
            expressed[expressedAttribute] = attribute;

            // Recreate scales
            var yScale = createYScale(csvData, chartHeight);
            var xScale = createXScale(csvData, chartWidth);
            var colorScale = makeColorScale(csvData);
            var radiusScale = createColorScale(csvData);

            // Update axes, calls the d3.axis___ methods with the new scales to visually update them whenever an attribute is changed.
            var xaxis = d3.select('.xaxis').call(
                d3.axisTop(xScale)
            )
            var yaxis = d3.select('.yaxis').call(
                d3.axisRight(yScale)
            )

            // Recolor enumeration units, essentially the same as when they are initialized
            var counties = d3.selectAll('.counties')
                .transition() // Initiates a transition, in this case smoothly switching between colors.
                .duration(1000) // The duration of the transition, 1000 = 1 second.
                .style('fill', function(d){
                    var value = d.properties[expressed.color] // Stores the value of a county's expressed variable
                    if (value) { // If the value for that county exists...
                        return colorScale(d.properties[expressed.color]); // ... Color its fill based on colorScale
                    } else { // Otherwise...
                        return '#ccc'; //... set its fill color to a light gray.
                    }
                });
            
            // Recolor and resize circles
            var circles = d3.selectAll('.bubble')
                .transition() // Initiates a transition. Transitions apply to all chained methods after itself.
                .duration(1000)
                // Recolor circles to match map
                .attr('fill', function(d){
                    return colorScale(parseFloat(d[expressed.color]));
                })
                // Resize circles
                .attr('r', function(d){
                    return radiusScale(parseFloat(d[expressed.color]));
                })
                // Calculate x and y position
                .attr('cx', function(d, i){
                    return xScale(parseFloat(d[expressed.x]))
                })
                .attr('cy', function(d, i){
                    return yScale(parseFloat(d[expressed.y]))
                })
        }
    };

    // Highlight/dehighlight functionality
    function highlight(props) {
        // Create label via setLabel()
        setLabel(props)
        // Add selected class to the selected element
        var selected = d3.selectAll('.' + props.COUNTYNAME.replace(/ /g, '-')) // Replaces spaces in county names with hyphens, to condense two-word counties to one class.)
            .attr('class', function (d){
                let elemClasses = this.classList; // Get current list of classes for each element
                elemClasses += ' selected' // Add 'selected' as a class to classList
                return elemClasses; // Replaces the prior classList with the one with 'selected'
            })
        .raise() // Visually raises selected element above other elements.
    };

    function dehighlight(props) {
        // Remove label made via setLabel()
        d3.select('.infolabel')
            .remove();
        // Removes selected class from the selected element.
        var selected = d3.selectAll('.' + props.COUNTYNAME.replace(/ /g, '-')) // See similar line in highlight()
            .attr('class', function(){
                let elemClasses = this.classList; // Get current list of classes for each element
                elemClasses.remove('selected') // Removes 'selected' from classList
                return elemClasses; // Replaces the prior classList with the one with 'selected'
            })
    };

    // Dynamic label functionality
    function setLabel(props) {
        // Gets the label of the expressed variable from attrObjects.
        var labelText = expressed.color 
        attrObjects.forEach(function(x) {
            if (expressed.color == x.attr) {
                labelText = x.label
            }
        })
        // Set up label content, backticks avoid string concatenation and makes it more readable.
        // Format: Expressed attribute value | County name | Expressed attribute name label
            var labelAttr = `<h1>${props[expressed.color]}</h1><b>${props.COUNTYNAME} County ${labelText}</b>`
        // Create infolabel div via an html string
            var infolabel = d3.select('body')
                .append('div')
                .attr('class', 'infolabel')
                .attr('id', `${props.COUNTYNAME.replace(/ /g, '-')}_label`) // See similar line in highlight()
                .html(labelAttr);
    }

    // Function to move labels with the mouse
    function moveLabel(event, d){
        // Get width of label via .node() and .getBoundingClientRect()
        var labelWidth = d3.select('.infolabel')
            .node() // Returns .infolabel's DOM node
            .getBoundingClientRect().width; // Retrieves the width property of the size of the label

        // Use cursor coordinates to set label coordinates
        // event.client_, a d3 object, takes the x and y coordinates of the cursor, originating from the top left of the screen.
        // window.scrollY prevents the tooltip from drifting vertically when the client scrolls down
        var x1 = event.clientX + 10,
            y1 = event.clientY + window.scrollY - 75,
            x2 = event.clientX - labelWidth - 10, // Secondary width, in case the label would overflow to the right
            y2 = event.clientY + window.scrollY + 25; // Likewise, but for overflow to the top

        // Setting horizontal label, checks for overflow to switch between x1 and x2
        var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
        // Likewise, but for vertical overflow to switch between y1 and y2
        var y = event.clientY < 75 ? y2 : y1;

        d3.select('.infolabel') // Selects the infolabel class, created in setLabel().
            .style('left', `${x}px`) // Adds "left: {x}px;" to the CSS styling of the infolabel class.
            .style('top', `${y}px`); // Likewise, but "top: {y}px;"
    }
})(); // Must always be the last line. Closes and executes the anonymous function wrapping main.json