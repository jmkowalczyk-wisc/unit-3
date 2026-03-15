// Execute script when window is laoded
window.onload = function(){
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

    var cityPop = [
    {city: 'Madison', population: 233209},
    {city: 'Milwaukee', population: 594833},
    {city: 'Green Bay', population: 104057},
    {city: 'Superior', population: 27244}
    ];

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
            return 90 + (index * 175);
        })
        .attr('cy', function(datum){ // Sets the center y attribute of the svg circles. Uses and scales the population to determine their offset from the top.
            return 450 - (datum.population * 0.0005);
        });
}