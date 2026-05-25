#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

// ANSI Terminal Colors for a premium console experience
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  purple: "\x1b[38;5;99m",
  green: "\x1b[38;5;82m",
  blue: "\x1b[38;5;39m",
  red: "\x1b[38;5;196m",
  cyan: "\x1b[38;5;51m",
  yellow: "\x1b[38;5;226m",
};

// Configuration file path inside user's home directory
const CONFIG_DIR = path.join(os.homedir(), '.nvmix');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure configuration directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Load current configuration
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Save configuration
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

// Interactive helper to ask the user a question in terminal
function askQuestion(queryText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => rl.question(queryText, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

// Beautiful terminal loader/spinner helper
let spinnerInterval;
function startSpinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  process.stdout.write('\n');
  spinnerInterval = setInterval(() => {
    process.stdout.write(`\r${COLORS.purple}${frames[i]}${COLORS.reset} ${COLORS.dim}${text}${COLORS.reset}`);
    i = (i + 1) % frames.length;
  }, 80);
}

function stopSpinner() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    process.stdout.write('\r\x1b[K'); // Clear line
  }
}

// Main execution block
async function main() {
  console.log(`\n${COLORS.bright}${COLORS.purple}✦ NVMIX AGENT SWARM COMMAND GATEWAY ✦${COLORS.reset}`);
  
  let config = loadConfig();
  let apiKey = config.apiKey || process.env.NVMIX_API_KEY;
  let targetUrl = config.targetUrl || 'https://nvmix.com/api/v1/chat/completions';

  // Command line args parsing
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${COLORS.bright}Usage:${COLORS.reset}
  nvmix                     Start an interactive terminal chat loop with the Swarm.
  nvmix "<prompt>"          Send a single directive directly to the agent.
  nvmix --config            Set or update your Nvmix API Key and Target Endpoint.
  nvmix --status            Verify credentials and target settings status.
    `);
    process.exit(0);
  }

  if (args.includes('--config') || !apiKey) {
    console.log(`\n${COLORS.cyan}🔐 Credentials Setup${COLORS.reset}`);
    if (!apiKey) {
      console.log(`${COLORS.yellow}No API Key detected. Please configure your credentials to authenticate with the swarm.${COLORS.reset}`);
    }
    
    const inputKey = await askQuestion(`${COLORS.bright}Enter your Nvmix API Key (starts with nvx_sk_ep_): ${COLORS.reset}`);
    if (!inputKey.startsWith('nvx_')) {
      console.log(`\n${COLORS.red}✗ Invalid API Key format! Keys must start with 'nvx_'${COLORS.reset}`);
      process.exit(1);
    }
    
    const inputUrl = await askQuestion(`${COLORS.bright}Enter Target Endpoint [https://nvmix.com/api/v1/chat/completions]: ${COLORS.reset}`);
    
    config.apiKey = inputKey;
    config.targetUrl = inputUrl || 'https://nvmix.com/api/v1/chat/completions';
    saveConfig(config);
    
    console.log(`\n${COLORS.green}✔ Configuration saved successfully inside ${CONFIG_FILE}!${COLORS.reset}\n`);
    apiKey = inputKey;
    targetUrl = config.targetUrl;
  }

  if (args.includes('--status')) {
    console.log(`
${COLORS.bright}Nvmix CLI Status:${COLORS.reset}
  ${COLORS.bright}• Target Endpoint:${COLORS.reset} ${COLORS.blue}${targetUrl}${COLORS.reset}
  ${COLORS.bright}• API Key Vault:${COLORS.reset}  ${COLORS.green}${apiKey.slice(0, 15)}••••••••••••••••${COLORS.reset}
  ${COLORS.bright}• Configuration:${COLORS.reset}  ${CONFIG_FILE}
    `);
    process.exit(0);
  }

  // Helper to send query to Nvmix API Gateway
  async function queryAgent(prompt, history = []) {
    const messages = [...history, { role: 'user', content: prompt }];
    startSpinner('Swarm computing in progress...');
    
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          messages: messages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      stopSpinner();
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server returned raw text instead of JSON: ${rawText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || 'Gateway refused authentication.');
      }

      const reply = data.choices[0].message.content;
      return { reply, messages };
    } catch (error) {
      stopSpinner();
      console.log(`\n\n${COLORS.red}✗ Inference Gateway Error:${COLORS.reset} ${error.message}`);
      return null;
    }
  }

  // Case 1: Single query prompt mode
  if (args.length > 0 && !args[0].startsWith('-')) {
    const prompt = args.join(' ');
    const result = await queryAgent(prompt);
    if (result) {
      console.log(`\n${COLORS.bright}${COLORS.purple}Orchestrator Swarm Response:${COLORS.reset}\n`);
      console.log(result.reply);
      console.log();
    }
    process.exit(0);
  }

  // Case 2: Interactive Chat Loop (Like Claude Code!)
  console.log(`\n${COLORS.green}✔ Swarm Command session initialized.${COLORS.reset}`);
  console.log(`${COLORS.dim}Type your commands below. Type "exit" or "clear" to control the console session.${COLORS.reset}\n`);

  let chatHistory = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptUser = () => {
    rl.question(`\n${COLORS.bright}${COLORS.blue}nvmix${COLORS.reset} ❯ `, async (input) => {
      const cleaned = input.trim();
      
      if (cleaned.toLowerCase() === 'exit' || cleaned.toLowerCase() === 'quit') {
        console.log(`\n${COLORS.purple}✦ Swarm connection closed. Goodbye! ✦${COLORS.reset}\n`);
        rl.close();
        process.exit(0);
      }
      
      if (cleaned.toLowerCase() === 'clear') {
        console.clear();
        console.log(`\n${COLORS.bright}${COLORS.purple}✦ NVMIX AGENT SWARM COMMAND GATEWAY ✦${COLORS.reset}\n`);
        promptUser();
        return;
      }

      if (!cleaned) {
        promptUser();
        return;
      }

      const result = await queryAgent(cleaned, chatHistory);
      if (result) {
        console.log(`\n${COLORS.bright}${COLORS.purple}Orchestrator Swarm Response:${COLORS.reset}\n`);
        console.log(result.reply);
        // Append current turn to chat history
        chatHistory = [...result.messages, { role: 'assistant', content: result.reply }];
      }
      
      promptUser();
    });
  };

  promptUser();
}

main().catch(err => {
  console.error(`\n${COLORS.red}✗ Terminal CLI Error:${COLORS.reset}`, err);
});
