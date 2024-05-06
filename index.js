import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';

const __dirname = path.resolve();
const jsonFilePath = path.join(__dirname, 'arc-boosts.json');

const isValidArcLink = (link) => /^https:\/\/arc\.net\/boost\/.+/.test(link);

const addBoost = (section, key, link, version, boostData) => {
  const updatedSectionData = { ...(boostData[section] || {}), [key]: { link, version } };
  return { ...boostData, [section]: updatedSectionData };
};

const saveChanges = (boostData, newBoosts) => {
  let updatedBoostData = { ...boostData };
  newBoosts.forEach(([section, key, link, version]) => {
    updatedBoostData = addBoost(section, key, link, version, updatedBoostData);
  });
  fs.writeFileSync(jsonFilePath, JSON.stringify(updatedBoostData, null, 2), 'utf8');
  generateReadmeAndUpdateFile(updatedBoostData); // Call to update README
  console.log(chalk.green('\nChanges saved successfully!\n'));
};


const generateReadmeAndUpdateFile = (boostData) => {
  let readmeContent = '# Arc Boosts\n\n';
  for (const section in boostData) {
    readmeContent += `## ${section}\n\n`;
    for (const key in boostData[section]) {
      const { link, version } = boostData[section][key];
      readmeContent += `- ${key} v${version}: [download](${link})\n\n`;
    }
  }
  fs.writeFileSync('README.md', readmeContent, 'utf8');
  console.log(chalk.green('README file generated successfully!'));
};

const launchCommandLineUI = (boostData) => {
  const listBoostNames = (boostData) => {
    if (!boostData) return 'none';
    
    const boostNames = Object.entries(boostData)
      .flatMap(([sectionName, section]) => Object.keys(section).map(key => `${sectionName}-${key}`))
      .join(', ');
    
    return boostNames;
  };

  console.log(chalk.green('Welcome to Arc Boosts Manager!'));
  console.log(chalk.magenta('To add a new boost, enter the section, key, its corresponding link, and version.'));
  console.log(chalk.magenta('Type "exit" at any point to finish and generate a README.'));
  console.log(chalk.gray('\nCurrent boosts:'), listBoostNames(boostData));  
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const newBoosts = [];

  const addNewBoost = () => {
    rl.question(chalk.blue('Section: '), (section) => {
      if (!section.trim() || section.trim() === 'exit') {
        rl.close();
        console.log(chalk.green('\nExiting...'));
        return;
      }

      rl.question(chalk.blue('Key: '), (key) => {
        if (!key.trim() || key.trim() === 'exit') {
          rl.close();
          console.log(chalk.green('\nExiting...'));
          return;
        }

        const existingBoost = boostData[section]?.[key];
        if (existingBoost) {
          console.warn(chalk.yellow(`\nWarning: Key "${key}" already exists in section "${section}".`));
          promptForLinkAndVersion(section, key, existingBoost);
        } else {
          promptForLinkAndVersion(section, key, existingBoost);
        }
      });
    });
  };

  const promptForLinkAndVersion = (section, key, existingBoost) => {
    rl.question(chalk.blue(`Link for "${key}" in "${section}": `), (link) => {
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

      rl.question(chalk.blue(`Version for "${key}" in "${section}": `), (version) => {
        version = version.trim();
      
        if (version === 'exit') {
          rl.close();
          console.log(chalk.green('\nExiting...'));
          return;
        }
      
        if (version !== '') {
          const versionPattern = /^\d+\.\d+\.\d+$/;
          if (!versionPattern.test(version)) {
            console.error(chalk.red('\nError: Invalid version. Version must be in the format <MAJOR>.<MINOR>.<PATCH>. Try again!\n'));
            addNewBoost();
            return;
          }
        } else version = incrementVersion(existingBoost?.version || "1.0.-1");
      
        try {
          newBoosts.push([section, key, link, version]);
          saveChanges(boostData, newBoosts);
        } catch (err) {
          console.error(chalk.red('An error occurred. Most likely because you tried incrementing something that does not exist.'));
        }
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
  else if (args[0] === '-a' && args.length === 5) {
    const [_, section, key, link, version] = args;
    if (!isValidArcLink(link)) {
      console.error(chalk.red('Error: Invalid link. Link must be in the format https://arc.net/boost/*'));
      return;
    }
    const newBoost = [[section, key, link, version]];
    saveChanges(boostData, newBoost);
  } else console.error(chalk.red('Invalid command. Usage: node script.js [-a section key link version]'));
};

init();
