const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const readline = require('readline');

// Define the path to the JSON file
const jsonFilePath = path.join(__dirname, 'arc-boosts.json');

// Function to read the JSON file and generate the README content
function generateReadme(boostData) {
  let readmeContent = '# Arc Boosts\n\n';

  for (const [key, link] of Object.entries(boostData)) {
    readmeContent += `## ${key}\n\n`;
    readmeContent += `[<kbd> <br> ${`Get it from Arc!`} <br> </kbd>][${key}]\n\n`;
    readmeContent += `[${key}]: ${link} 'Get it from Arc'\n\n`;
  }

  return readmeContent;
}


// Function to add a new boost to the JSON file
function addBoost(key, link, boostData) {
  // Check if the key already exists
  if (boostData[key]) {
    console.log(`Overwriting existing boost for "${key}"`);
  }

  // Add the new boost to the data
  boostData[key] = link;

  return boostData;
}

// Function to launch command-line UI for adding a new boost
function launchCommandLineUI(boostData) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the key for the new boost: ', (key) => {
    rl.question('Enter the link for the new boost: ', (link) => {
      boostData = addBoost(key, link, boostData);
      fs.writeFileSync(jsonFilePath, JSON.stringify(boostData, null, 2), 'utf8');
      console.log(`Added new boost for "${key}"`);
      rl.close();
      generateReadmeAndUpdateFile(boostData);
    });
  });
}

// Function to generate README content and write it to file
function generateReadmeAndUpdateFile(boostData) {
  const readmeContent = generateReadme(boostData);
  fs.writeFileSync('README.md', readmeContent, 'utf8');
  console.log('README file generated successfully!');
}

// Set up the command-line interface
program
  .version('1.0.0')
  .description('Generate an aesthetic README file for displaying Arc boosts')
  .action((options) => {
    // Read the JSON file
    let boostData = {};
    try {
      if (fs.existsSync(jsonFilePath)) {
        boostData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
      } else {
        console.log('No JSON file found. Creating a new one.');
      }
    } catch (err) {
      console.error('Error reading JSON file:', err);
      return;
    }

    // Handle adding new boost through command-line UI if no arguments are supplied
    if (process.argv.length <= 2) {
      launchCommandLineUI(boostData);
    } else if (options.add) { // Handle adding new boost with arguments
      boostData = addBoost(options.add[0], options.add[1], boostData);
      fs.writeFileSync(jsonFilePath, JSON.stringify(boostData, null, 2), 'utf8');
      console.log(`Added new boost for "${options.add[0]}"`);
      generateReadmeAndUpdateFile(boostData);
    }
  });

program.parse(process.argv);
