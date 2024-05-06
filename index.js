import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';

const __dirname = path.resolve();
const jsonFilePath = path.join(__dirname, 'arc-boosts.json');

const isValidArcLink = (link) => /^https:\/\/arc\.net\/boost\/.+/.test(link);

const addBoost = (key, link, version, boostData) => {
  return {...boostData, [key]: { link, version }};
};

const generateReadmeAndUpdateFile = (boostData) => {
  const readmeContent = `# Arc Boosts\n\n${Object.entries(boostData).map(([key, { link, version }]) => (
    `## ${key}\n\nVersion: ${version}\n\n[<kbd> <br> ${'I want this!'} <br> </kbd>][${key}]\n\n[${key}]: ${link} 'I want this!'\n\n`
  )).join('')}`;
  fs.writeFileSync('README.md', readmeContent, 'utf8');
  console.log(chalk.green('README file generated successfully!'));
};

const saveChanges = (boostData, newBoosts) => {
  const updatedBoostData = newBoosts.reduce((acc, [key, link, version]) => addBoost(key, link, version, acc), boostData);
  fs.writeFileSync(jsonFilePath, JSON.stringify(updatedBoostData, null, 2), 'utf8');
  console.log(chalk.green(`Added ${newBoosts.length} new boost(s)`));
  generateReadmeAndUpdateFile(updatedBoostData);
};

const launchCommandLineUI = (boostData) => {
  console.log(chalk.green('Welcome to Arc Boosts Manager!'));
  console.log(chalk.magenta('To add a new boost, enter the key, its corresponding link, and version.'));
  console.log(chalk.magenta('Type "exit" at any point to finish and generate a README.'));
  console.log(chalk.gray('\nCurrent boosts:'), Object.keys(boostData).join(', ') || 'none');
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const newBoosts = [];

  const addNewBoost = () => {
    rl.question(chalk.blue('Key: '), (key) => {
        if (!key.trim() || key.trim() === 'exit') {
            rl.close();
            console.log(chalk.green('\nExiting...'));
            return;
        }

        const existingBoost = boostData[key];
        if (existingBoost) {
            console.warn(chalk.yellow(`\nWarning: Key "${key}" already exists.`));
            promptForLinkAndVersion(key, existingBoost);
        } else {
            promptForLinkAndVersion(key, existingBoost);
        }
    });
};

  const promptForLinkAndVersion = (key, existingBoost) => {
      rl.question(chalk.blue(`Link for "${key}": `), (link) => {
          if (!link.trim() || link.trim() === 'exit') {
              rl.close();
              console.log(chalk.green('\nExiting...'));
              return;
          }

          if (!isValidArcLink(link)) {
              console.error(chalk.red('Error: Invalid link. Link must be in the format https://arc.net/boost/*. Try again!\n'));
              addNewBoost();
              return;
          }

          rl.question(chalk.blue(`Version for "${key}": `), (version) => {
              const newVersion = incrementVersion(existingBoost.version);
              newBoosts.push([key, link, version.trim() || newVersion]);
              saveChanges(boostData, newBoosts);
              addNewBoost();
          });
      });
  };

  const incrementVersion = (currentVersion) => {
      const [major, minor, patch] = currentVersion.split('.').map(Number);
      return `${major}.${minor}.${patch + 1}`;
  };
  addNewBoost();
};

const loadBoostData = () => {
  let boostData = {};
  try {
    if (fs.existsSync(jsonFilePath)) boostData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    else console.log(chalk.yellowBright('No JSON file found on startup.\nA new one will be created after adding boosts.\n'));
  } catch (err) {
    console.error(chalk.red('An unexpected error occurred when reading JSON file:', err));
  }
  return boostData;
};

const init = () => {
  const boostData = loadBoostData();

  const args = process.argv.slice(2);

  if (args.length === 0) launchCommandLineUI(boostData);

  else if (args[0] === '-a' && args.length === 4) {
    const [_, key, link, version] = args;
    if (!isValidArcLink(link)) {
      console.error(chalk.red('Error: Invalid link. Link must be in the format https://arc.net/boost/*'));
      return;
    }
    const newBoost = [[key, link, version]];
    saveChanges(boostData, newBoost);
  } 
  
  else console.error(chalk.red('Invalid command. Usage: node script.js [-a key link version]'));
};

init();
