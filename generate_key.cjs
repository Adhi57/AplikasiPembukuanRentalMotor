/**
 * KEY GENERATOR TOOL
 * 
 * Usage: node generate_key.js <MACHINE_ID>
 * Example: node generate_key.js 1234-5678-ABCD
 */

const crypto = require('crypto');

// PASTIKAN KEY INI SAMA PERSIS DENGAN DI RUST (src-tauri/src/license.rs)
const SECRET_KEY = "rent_motor_secret_key_v1_secure_8823";

const machineId = process.argv[2];

if (!machineId) {
    console.error("Error: Mohon masukkan Machine ID.");
    console.log("Usage: node generate_key.js <MACHINE_ID>");
    process.exit(1);
}

const hmac = crypto.createHmac('sha256', SECRET_KEY);
hmac.update(machineId);
const licenseKey = hmac.digest('hex');

console.log("\n============================================");
console.log(" LICENSE KEY GENERATOR");
console.log("============================================");
console.log(`Machine ID : ${machineId}`);
console.log(`Secret Key : ${SECRET_KEY}`);
console.log("--------------------------------------------");
console.log(`LICENSE KEY: ${licenseKey}`);
console.log("============================================\n");
