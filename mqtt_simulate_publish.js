const mqtt = require("mqtt");
const fs = require("fs");
const path = require("path");

// Load test payloads
const payloads = JSON.parse(
	fs.readFileSync(path.join(__dirname, "mqtt_test_payloads.json"), "utf8")
);

// MQTT broker config
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://localhost:1883";
const MQTT_TOPIC = process.env.MQTT_TOPIC || "biogas/live";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "biogas";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "biogas";
const INTERVAL_MS = 10000; // 10 seconds

// Helper to generate random value in a range
function randomInRange(min, max, decimals = 1) {
	const factor = Math.pow(10, decimals);
	return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

// Simulate random sensor values for each payload
function generateRandomPayload(base, timestamp) {
	const valueRanges = {
		r: [210, 250],
		y: [210, 250],
		b: [210, 250],
		frequency: [48, 52],
		ph: [6.5, 8.5],
		temperature: [20, 60],
		weight: [0, 100],
		moisture: [10, 90],
		humidity: [20, 90],
	};
	// Map reg_add/slave_id to value type
	const keyMap = {
		"3_0": "r",
		"3_2": "y",
		"3_4": "b",
		"3_56": "frequency",
		"2_2": "ph",
		"2_3": "temperature",
		"7_0": "weight",
		"8_0": "moisture",
		"8_1": "humidity",
	};
	const key = `${base.slave_id}_${base.reg_add}`;
	const valueType = keyMap[key];
	let value = base.value;
	if (valueType && valueRanges[valueType]) {
		value = randomInRange(
			valueRanges[valueType][0],
			valueRanges[valueType][1],
			valueType === "weight" ? 0 : 1
		);
	}
	return {
		...base,
		value,
		d_ttime: timestamp,
	};
}

// MQTT client with authentication
const client = mqtt.connect(MQTT_BROKER, {
	username: MQTT_USERNAME,
	password: MQTT_PASSWORD,
	clientId: `biogas-simulator-${Math.random().toString(16).slice(3)}`,
	clean: true,
	reconnectPeriod: 1000,
	connectTimeout: 30 * 1000,
});

client.on("connect", () => {
	console.log(`Connected to MQTT broker at ${MQTT_BROKER}`);
	setInterval(() => {
		// Use current date and time in IST for each round
		const now = new Date();
		const istNow = new Date(
			now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
		);
		const yyyy = istNow.getFullYear();
		const mm = String(istNow.getMonth() + 1).padStart(2, "0");
		const dd = String(istNow.getDate()).padStart(2, "0");
		const hh = String(istNow.getHours()).padStart(2, "0");
		const min = String(istNow.getMinutes()).padStart(2, "0");
		const ss = String(istNow.getSeconds()).padStart(2, "0");
		const timestamp = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
		console.log(`\nPublishing simulated data for IST timestamp: ${timestamp}`);
		payloads.forEach((basePayload) => {
			const payload = generateRandomPayload(basePayload, timestamp);
			client.publish(MQTT_TOPIC, JSON.stringify(payload), { qos: 1 }, (err) => {
				if (err) {
					console.error("Publish error:", err);
				} else {
					console.log(`Published: ${JSON.stringify(payload)}`);
				}
			});
		});
	}, INTERVAL_MS);
});

client.on("error", (err) => {
	console.error("MQTT error:", err);
});
