const fs = require('fs');

// Function to process stations
function processStations(inputFilePath, outputFilePath) {
  try {
    // Read the existing stations from the input file
    const rawData = fs.readFileSync(inputFilePath);
    const stations = JSON.parse(rawData);

    // Process each station
    const updatedStations = stations.map(station => {
      // Convert name to title case
      const updatedName = station.name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Create englishName by replacing dashes with spaces in romanizedName
      const englishName = station.romanizedName
        .toLowerCase()
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Remove the romanizedName field
      delete station.romanizedName;

      // Add the englishName field
      station.englishName = englishName;

      // Update the name field
      station.name = updatedName;

      return station;
    });

    // Write the updated stations to the output file
    fs.writeFileSync(outputFilePath, JSON.stringify(updatedStations, null, 2));

    console.log('Stations processed successfully.');
  } catch (error) {
    console.error('Error processing stations:', error.message);
  }
}

// Example usage
const inputFilePath = '/Users/tisho/Desktop/backend/diploma_project/test/stations.json';
const outputFilePath = 'new_names_stations.json';

processStations(inputFilePath, outputFilePath);