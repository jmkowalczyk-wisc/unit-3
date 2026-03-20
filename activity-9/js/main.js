// Start script once window loads
window.onload = initMap();

// Initialize choropleth map
function initMap() {
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
        
        // Using topojson.feature() to translate .topojson data to .geojson
        var borderStates = topojson.feature(borderData, borderData.objects.IL_bordershapes),
            countyShapes = topojson.feature(countyData, countyData.objects.IL_counties);

        // Logging to check, delete for Lesson 2
        console.log(borderStates);
        console.log(countyShapes);
    }
}