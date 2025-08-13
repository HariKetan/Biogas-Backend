const crypto = require("crypto");

// Generate a secure random string for JWT signing
const generateAuthKey = () => {
	// Generate 64 random bytes and convert to hex string
	const authKey = crypto.randomBytes(64).toString("hex");
	console.log("🔐 Generated secure AUTH_KEY:");
	console.log("=".repeat(50));
	console.log(authKey);
	console.log("=".repeat(50));
	console.log("\n📝 Copy this value to your .env file as:");
	console.log(`AUTH_KEY=${authKey}`);
	console.log("\n⚠️  Keep this key secure and never share it!");
};

generateAuthKey();
