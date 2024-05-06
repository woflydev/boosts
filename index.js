import fs, { read } from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';

const __dirname = path.resolve();
const jsonFilePath = path.join(__dirname, 'arc-boosts.json');

const isValidArcLink = (link) => /^https:\/\/arc\.net\/boost\/.+/.test(link);

const addBoost = (section, key, link, version, description, boostData) => {
  const updatedSectionData = { ...(boostData[section] || {}), [key]: { link, version } };
  const updatedSection = { description, ...updatedSectionData };
  return { ...boostData, [section]: updatedSection };
};

const saveChanges = (boostData, newBoosts) => {
  let updatedBoostData = { ...boostData };
  newBoosts.forEach(([section, key, link, version, description]) => {
    updatedBoostData = addBoost(section, key, link, version, description, updatedBoostData);
  });
  fs.writeFileSync(jsonFilePath, JSON.stringify(updatedBoostData, null, 2), 'utf8');
  generateReadmeAndUpdateFile(updatedBoostData);
  console.log(chalk.green('Changes saved successfully!\n'));
};

const generateReadmeAndUpdateFile = (boostData) => {
  let readmeContent = 
    `# Arc Boosts
    \nA collection boosts I've made for the [Arc Browser](https://arc.net/). One-click install supported, provided you're on Arc, of course!
    \n\n![](/doc/arc.webp)\n\n`;
  readmeContent += 
  "# Collections\n" + 
  "Various collections of boosts that I feel like fit into a single category.\n\n";
  for (const section in boostData) {
    readmeContent += `## ${section}\n`;
    readmeContent += `${boostData[section].description}\n\n`;
    for (const key in boostData[section]) {
      if (key !== 'description') {
        const { link, version } = boostData[section][key];
        readmeContent += `- ${key} v${version}: [download](${link})\n\n`;
      }
    }
  }
  readmeContent += 
  "# About this Project\n\n" + 
  "This file is automatically generated. " +
  "If you're interested in adding your own boosts," + 
  "`git clone` this repo and run `pnpm start`. Follow the instructions and you should be fine. \n\nShould I have spent a few hours of my life" + 
  "polishing this CLI and streamlining the entire publishing experience? Probably not." + 
  "Look it's 12am when I'm writing this and I'm so tired. Why spend 5 minutes doing something when you can spend 5 hours automating it.\n\n" + 
  "So now be treated to some pretty website pictures so I don't feel like all my work has gone to waste." + 
  `\n\n<p align="center">\n<img src="/doc/img1.png" alt="gh"/>\n</p>\n\n`
  + `\n\n<p align="center">\n<img src="/doc/img2.png" alt="gh"/>\n</p>\n\n` + `\n\n<p align="center">\n<img src="/doc/img3.png" alt="gh"/>\n</p>\n\n` + `\n\n<p align="center">\n<img src="/doc/img4.png" alt="gh"/>\n</p>\n\n` + 
  "# What is Arc and Why am I Here??\n\n" +
  "Glad you asked! Download it from their site, you won't regret it! -> [Arc Browser](https://arc.net/gift/5a2737fa).";
  fs.writeFileSync('README.md', readmeContent, 'utf8');
  console.log(chalk.green('\nREADME file generated successfully!'));
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
    rl.question(chalk.blue(`Link for "${section}-${key}": `), (link) => {
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

      rl.question(chalk.blue(`Version for "${section}-${key}" ('enter' for auto-version): `), (version) => {
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
  } 
  else if (args[0] === '-s' && args.length === 1) generateReadmeAndUpdateFile(boostData);
  else if ((args[0] === '-h' || args[0] === '--help') && args.length === 1) 
      console.log(chalk.blue(`Usage:
      pnpm start [-a <section> <key> <link> <version>] to add a boost.
      pnpm start [-s] to generate README.md
      pnpm start [-h] or [--help] to display this message.
      `));
  else console.error(chalk.red('Invalid command. Usage: node script.js [-a section key link version]'));
};

init();
