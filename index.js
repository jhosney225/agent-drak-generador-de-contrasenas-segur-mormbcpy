
```javascript
#!/usr/bin/env node

import Anthropic from "@anthropic-ai/sdk";
import * as crypto from "crypto";
import * as readline from "readline";

const client = new Anthropic();

// Calculate Shannon entropy of a password
function calculateEntropy(password) {
  const frequencies = {};
  for (const char of password) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  const length = password.length;

  for (const count of Object.values(frequencies)) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

// Estimate password strength based on entropy
function estimateStrength(entropy, length) {
  if (entropy < 2) return "Very Weak";
  if (entropy < 3) return "Weak";
  if (entropy < 4) return "Fair";
  if (entropy < 4.7) return "Good";
  if (entropy < 5.2) return "Strong";
  return "Very Strong";
}

// Generate a secure random password
function generatePassword(length, useUppercase, useLowercase, useNumbers, useSymbols) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let characters = "";
  let password = "";

  if (useUppercase) characters += uppercase;
  if (useLowercase) characters += lowercase;
  if (useNumbers) characters += numbers;
  if (useSymbols) characters += symbols;

  if (!characters) characters = lowercase + numbers;

  // Ensure at least one character from each selected type
  if (useUppercase) password += uppercase[Math.floor(Math.random() * uppercase.length)];
  if (useLowercase) password += lowercase[Math.floor(Math.random() * lowercase.length)];
  if (useNumbers) password += numbers[Math.floor(Math.random() * numbers.length)];
  if (useSymbols) password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += characters[Math.floor(Math.random() * characters.length)];
  }

  // Shuffle the password
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
}

// Analyze password with Claude
async function analyzePasswordWithClaude(password) {
  const entropy = calculateEntropy(password);
  const strength = estimateStrength(entropy, password.length);

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this password for security: "${password}"
        
Password metrics:
- Length: ${password.length}
- Entropy: ${entropy.toFixed(2)} bits
- Estimated Strength: ${strength}
- Contains uppercase: ${/[A-Z]/.test(password) ? "Yes" : "No"}
- Contains lowercase: ${/[a-z]/.test(password) ? "Yes" : "No"}
- Contains numbers: ${/[0-9]/.test(password) ? "Yes" : "No"}
- Contains symbols: ${/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? "Yes" : "No"}

Provide a brief security assessment and recommendations.`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

// Interactive command-line interface
async function runInteractiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  };

  console.log("\n🔐 Secure Password Generator with Entropy Measurement");
  console.log("======================================================\n");

  let continueLoop = true;

  while (continueLoop) {
    console.log("\nOptions:");
    console.log("1. Generate new password");
    console.log("2. Analyze existing password");
    console.log("3. Exit");

    const choice = await question("\nSelect option (1-3): ");

    if (choice === "1") {
      const length = parseInt(await question("Password length (default 16): ") || "16");
      const useUppercase =
        (await question("Include uppercase letters? (y/n, default y): ")).toLowerCase() !== "n";
      const useLowercase =
        (await question("Include lowercase letters? (y/n, default y): ")).toLowerCase() !== "n";
      const useNumbers =
        (await question("Include numbers? (y/n, default y): ")).toLowerCase() !== "n";
      const useSymbols =
        (await question("Include symbols? (y/n, default y): ")).toLowerCase() !== "n";

      const password = generatePassword(
        Math.max(8, Math.min(128, length)),
        useUppercase,
        useLowercase,
        useNumbers,
        useSymbols
      );

      const entropy = calculateEntropy(password);
      const strength = estimateStrength(entropy, password.length);

      console.log("\n✅ Generated Password: " + password);
      console.log(`📊 Entropy: ${entropy.toFixed(2)} bits`);
      console.log(`💪 Strength: