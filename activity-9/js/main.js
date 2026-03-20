// Execute script when window is laoded
window.onload = function(){
    // Container and Background
    var container = d3.select('body') // Like querySelector(), get the <body> element from the DOM
        .append("svg") // Puts a new <svg> tag in the body
        .attr('width', 900) // Assigns the width of the <svg> element
        .attr('height', 500) // Assigns the height of the <svg> element
        .attr('class', 'container') // Assigns the class 'container' to the <svg> element.
        .style('background-color', 'rgba(0, 0, 0, 0.2)'); // Sets a background color.

    var innerRect = container.append("rect") // Puts a new rectangle in the svg. It's best practice to add one element per "block"
        .datum(400) // .datum() stores a single value in an element
        .attr('width', function(datum){ // Anonymous functions can be used in place of a value for the .attr() method
            return datum * 2
        })
        .attr('height', function(datum){
            return datum
        })
        .attr('class', 'innerRect')
        .attr('x', 50) // x attribute sets position in pixels from the left
        .attr('y', 50) // y attribute sets position in pixels from the top
        .style('fill', '#fff'); // Sets a fill color.

    // Data Setup
    // D3 requires an array as an input when inputting data. This can be an array of individual JSON objects.
    var cityPop = [
    {city: 'Madison', population: 233209},
    {city: 'Milwaukee', population: 594833},
    {city: 'Green Bay', population: 104057},
    {city: 'Superior', population: 27244}
    ];

    // Bubble Graph
    var indexScale = d3.scaleLinear() // Create a linear scalar
        .range([90, 810]) // Sets the minimum and maximum values of the scalar's *output*
        .domain([0, 3]); // Sets the minimum and maximum values of the scalar's *input*

    var minPop = d3.min(cityPop, function(datum){ // D3 has its own dedicated minimum and maximum function that iterates through given data.
        return datum.population;
    });

    var maxPop = d3.max(cityPop, function(datum){
        return datum.population;
    });

    var populationScale = d3.scaleLinear()
        .range([450, 50]) // Range is flipped here, due to how CSS handles the cy parameter for circles.
        .domain([0, 700000]); // Domain is manually set here, allows the y axis created later to span the inner rectangle.

    var colorScale = d3.scaleLinear()
        .range(['#deebf7', '#3182bd']) // D3's scale function can tween between colors like it can with numbers!
        .domain([minPop, maxPop]) // .range() and .domain() can take functions that return a value as parameters.

    var circles = container.selectAll('.circles') // The circles class can still be selected despite not existing yet. It just creates an empty selection. Best practice to set selector name to the class you'll eventually assign the element.
        .data(cityPop) // Applies the given datum to the selection
        .enter() // Joins the data to the selection
        .append('circle') // Adds a circle tag for each datum in the array
        .attr('class', 'circles') // Applies the circles class to all circles.
        .attr('id', function(datum){
            return datum.city;
        })
        .attr('r', function(datum){ // Sets the radius attribute of the svg circles. Uses a function based on the population attribute of the cities.
            var area = datum.population * 0.01;
            return Math.sqrt(area / Math.PI);
        })
        .attr('cx', function(datum, index){ // Sets the center X attribute of the svg circles. Uses the index to space the circles evenly
            return indexScale(index);
        })
        .attr('cy', function(datum){ // Sets the center y attribute of the svg circles. Uses and scales the population to determine their offset from the top.
            return populationScale(datum.population);
        })
        .style('fill', function(datum, index){ // Sets the fill color of the circles based on the color scale.
            return colorScale(datum.population);
        })
        .style('stroke', '#000'); // Sets the stroke/border color of the circles.

    // Axes
    var yAxis = d3.axisLeft(populationScale); // Sets up the axis generator
    
    var axis = container.append('g') // d3.axisLeft draws several child elements. This puts all of them in a group <g> element.
        .attr('class', 'axis')
        .attr('transform', 'translate(50, 0)') // By default, axisLeft aligns the axis's right edge to the left edge of the container. This moves it to the right to align it with the chart.
        .call(yAxis); // Calls yAxis. Functionally the same as putting yAxis(axis) after this block.

    // Text elements
    var title = container.append('text')
        .attr('class', 'title')
        .attr('text-anchor', 'middle') // Center-justifies the text in the element.
        .attr('x', 450) // Sets the position of the text anchor in the element.
        .attr('y', 30)
        .text('City Populations') // Sets the content of the text element.

    var labels = container.selectAll('.labels') // Like with .circles, we can create an empty selector by selecting a class that doesn't exist yet.
        .data(cityPop)
        .enter()
        .append('text')
        .attr('class', 'labels')
        .attr('text-anchor', 'left')
        .attr('y', function(datum){ // Vertical position centered on each circle
            return populationScale(datum.population) + 5;
        });

    var nameLine = labels.append('tspan')
        .attr('class', 'nameLine')
        .attr('x', function(datum, index){ // Horizontal position to the right of each circle
            return indexScale(index) + Math.sqrt(datum.population * 0.01 / Math.PI) + 5;
        })
        .text(function(datum){ // Content of this line of the label
            return datum.city; 
        });

    // Format generator for population numbers
    var format = d3.format(',');

    var popLine = labels.append('tspan')
        .attr('class', 'popLine')
        .attr('x', function(datum, index){
            return indexScale(index) + Math.sqrt(datum.population * 0.01 / Math.PI) + 5;
        })
        .attr('dy', '15')
        .text(function(datum){ 
            return `Pop. ${format(datum.population)}`; // Backticks (``) act like Python f-strings, refer to a variable via ${}.
        })
    


}