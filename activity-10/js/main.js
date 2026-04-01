// Start script once window loads
window.onload = initMap();

// Initialize choropleth map
function initMap() {
    // Dimensions of map frame
    var width = 960,
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
            countyShapes = topojson.feature(countyData, countyData.objects.IL_counties);

        // Adding the border states to the map. This acts like a base map without interactivity.
        var states = map
            .append('path') // map is already an <svg> element, this adds a <path> to it.
            .datum(borderStates) // .datum() is used here to create a reference layer that doesn't need interaction
            .attr('class', 'states')
            .attr('d', path); // 'd' contains the data for a path. It takes the place of r, cx, and cy for circles, or other similar parameters.

        // Adding counties to the maps. These need to be individually interactable.
        var counties = map
            .selectAll('.counties') // Creates empty selection by selecting a class ahead of its creation
            .data(countyShapes.features) // .features needs to be added so D3 can iterate through the entire feature collection.
            .enter() // Needed to process the data
            .append('path') // Adds a <path> element to the existing <svg> element in map
            .attr('class', function(d){ // Adds two classes to each feature: counties, which is selected earlier, and the name of the county.
                return "counties " + d.properties.COUNTYNAME;
            })
            .attr('d', path); // Adds path data.

    }
}