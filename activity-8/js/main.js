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
}