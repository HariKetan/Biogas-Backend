const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3500;
const db = require("./db/dbconnect.js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: '.env' });

const secretKey = process.env.AUTH_KEY;

app.use(cors());
app.use(express.json());

// Middleware to authenticate JWT tokens
const authenticateJWT = (req, res, next) => {
	const token = req.header("Authorization");
	if (!token) return res.sendStatus(401);

	jwt.verify(token, secretKey, (err, user) => {
		if (err) return res.sendStatus(403);
		req.user = user;
		next();
	});
};

app.post("/api/v1/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		const result = await db.query(
			"SELECT uid FROM user_details WHERE email=($1) AND password=($2)",
			[email, password]
		);
		const user = result.rows[0];
		console.log(req.body);
		if (user) {
			if (email == "admin@mail.com") result.rows[0].type = "admin";
			const token = jwt.sign({ id: user.uid, useremail: email }, secretKey);
			return res.status(200).json({
				token: token,
				type: result.rows[0].type,
				uid: result.rows[0].uid,
			});
		}

		return res.status(404).json({ message: 404 });
	} catch (err) {
		console.log(err.message);
		return res.status(500).json({ error: err.message });
	}
});

app.get("/api/v1/authenticate", authenticateJWT, (req, res) => {
	res.status(200).json({ message: "Valid User 👍" });
});

app.get("/api/v1/devices", async (req, res) => {
	try {
		const result = await db.query("Select * from device");

		res.status(200).json(result.rows);
	} catch (err) {
		console.log(err);
	}
});

app.post("/api/v1/adddevice", async (req, res) => {
	try {
		const { device_id, longitude, latitude, description } = req.body;
		const values = [device_id, longitude, latitude, description];
		const query =
			"INSERT INTO device (device_id, logitude, latitude, description) VALUES ($1, $2, $3, $4)";
		const result = await db.query(query, values);
		console.log(
			res.status(200).json({
				message: "success",
			})
		);
	} catch (err) {
		console.log(err);
		res.send(err.message);
	}
});

app.get("/api/v1/sensor_values", async (req, res) => {
	try {
		const deviceId = req.query.device_id || '1014'; // Default to 1014 if not specified
		const result = await db.query(`
    SELECT
    sv.device_id AS "device_id",
    MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '3' THEN sv.value END) AS "r",
    MAX(CASE WHEN sp.reg_add = '2' AND sv.slave_id = '3' THEN sv.value END) AS "y",
    MAX(CASE WHEN sp.reg_add = '4' AND sv.slave_id = '3' THEN sv.value END) AS "b",
    MAX(CASE WHEN sp.reg_add = '56' AND sv.slave_id = '3' THEN sv.value END) AS "frequency",
    MAX(CASE WHEN sp.reg_add = '2' AND sv.slave_id = '2' THEN sv.value END) AS "ph",
    MAX(CASE WHEN sp.reg_add = '3' AND sv.slave_id = '2' THEN sv.value END) AS "temperature",
    MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '7' THEN sv.value END) AS "weight",
    MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '8' THEN sv.value END) AS "moisture",
    MAX(CASE WHEN sp.reg_add = '1' AND sv.slave_id = '8' THEN sv.value END) AS "humidity",
    MAX(sv.d_ttime) AS "dtime"
FROM
    sensor_value sv
JOIN
    sensor_parameters sp ON sv.device_id = sp.device_id AND sv.slave_id = sp.slave_id AND sv.reg_add = sp.reg_add
WHERE
    sv.device_id = $1
GROUP BY
    sv.device_id, sv.d_ttime
ORDER BY
    "dtime" DESC;
    `, [deviceId]);

		console.log(result.rows);
		res.json(result.rows);
	} catch (err) {
		console.log(err.message);
		res.status(500).json({ error: err.message });
	}
});

app.get("/api/v1/dashboard", async (req, res) => {
	try {
		const deviceId = req.query.device_id || '1014'; // Default to 1014 if not specified
		const result = await db.query(` SELECT
        sv.device_id AS "device_id",
        MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '3' THEN sv.value END) AS "r",
        MAX(CASE WHEN sp.reg_add = '2' AND sv.slave_id = '3' THEN sv.value END) AS "y",
        MAX(CASE WHEN sp.reg_add = '4' AND sv.slave_id = '3' THEN sv.value END) AS "b",
        MAX(CASE WHEN sp.reg_add = '56' AND sv.slave_id = '3' THEN sv.value END) AS "frequency",
        MAX(CASE WHEN sp.reg_add = '2' AND sv.slave_id = '2' THEN sv.value END) AS "ph",
        MAX(CASE WHEN sp.reg_add = '3' AND sv.slave_id = '2' THEN sv.value END) AS "temperature",
        MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '7' THEN sv.value END) AS "weight",
        MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '8' THEN sv.value END) AS "moisture",
        MAX(CASE WHEN sp.reg_add = '1' AND sv.slave_id = '8' THEN sv.value END) AS "humidity",
        MAX(sv.d_ttime) AS "dtime"
    FROM
        sensor_value sv
    JOIN
        sensor_parameters sp ON sv.device_id = sp.device_id AND sv.slave_id = sp.slave_id AND sv.reg_add = sp.reg_add
    WHERE
        sv.device_id = $1
    GROUP BY
        sv.device_id, sv.d_ttime
    ORDER BY
        "dtime" DESC
    LIMIT 1;
    
    `, [deviceId]);
		res.status(200).json(result.rows);
	} catch (err) {
		console.log(err.message);
	}
});

// Get data for device 1368 specifically
app.get("/api/v1/device1368", async (req, res) => {
	try {
		const result = await db.query(`
		SELECT
			sv.device_id AS "device_id",
			MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '7' THEN sv.value END) AS "weight",
			MAX(CASE WHEN sp.reg_add = '0_1' AND sv.slave_id = '1' THEN sv.value END) AS "methane1",
			MAX(CASE WHEN sp.reg_add = '0_2' AND sv.slave_id = '1' THEN sv.value END) AS "methane2",
			MAX(CASE WHEN sp.reg_add = '0_3' AND sv.slave_id = '1' THEN sv.value END) AS "methane3",
			MAX(CASE WHEN sp.reg_add = '0_4' AND sv.slave_id = '1' THEN sv.value END) AS "methane4",
			MAX(CASE WHEN sp.reg_add = '0_5' AND sv.slave_id = '1' THEN sv.value END) AS "methane5",
			MAX(CASE WHEN sp.reg_add = '0_6' AND sv.slave_id = '1' THEN sv.value END) AS "methane6",
			MAX(CASE WHEN sp.reg_add = '0_1' AND sv.slave_id = '2' THEN sv.value END) AS "ph1",
			MAX(CASE WHEN sp.reg_add = '0_2' AND sv.slave_id = '2' THEN sv.value END) AS "ph2",
			MAX(CASE WHEN sp.reg_add = '0_3' AND sv.slave_id = '2' THEN sv.value END) AS "ph3",
			MAX(CASE WHEN sp.reg_add = '0_4' AND sv.slave_id = '2' THEN sv.value END) AS "ph4",
			MAX(sv.d_ttime) AS "dtime",
			MAX(sv.u_time) AS "u_time"
		FROM
			sensor_value sv
		JOIN
			sensor_parameters sp ON sv.device_id = sp.device_id AND sv.slave_id = sp.slave_id AND sv.reg_add = sp.reg_add
		WHERE
			sv.device_id = '1368'
		GROUP BY
			sv.device_id, sv.d_ttime
		ORDER BY
			"dtime" DESC
		LIMIT 1;
		`);
		res.status(200).json(result.rows);
	} catch (err) {
		console.log(err.message);
		res.status(500).json({ error: err.message });
	}
});

// Get detailed individual sensor values for device 1368
app.get("/api/v1/device1368/sensors", async (req, res) => {
	try {
		const result = await db.query(`
		SELECT
			sv.device_id,
			sv.slave_id,
			sv.reg_add,
			sp.keys AS sensor_name,
			sp.siunit,
			sv.value,
			sv.d_ttime,
			sv.u_time
		FROM
			sensor_value sv
		JOIN
			sensor_parameters sp ON sv.device_id = sp.device_id AND sv.slave_id = sp.slave_id AND sv.reg_add = sp.reg_add
		WHERE
			sv.device_id = '1368'
		ORDER BY
			sv.slave_id, sv.reg_add, sv.u_time DESC;
		`);
		res.status(200).json(result.rows);
	} catch (err) {
		console.log(err.message);
		res.status(500).json({ error: err.message });
	}
});

// Get all devices with their latest sensor data
app.get("/api/v1/all-devices-data", async (req, res) => {
	try {
		const result = await db.query(`
		SELECT DISTINCT ON (sv.device_id)
			sv.device_id AS "device_id",
			MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '3' THEN sv.value END) AS "r",
			MAX(CASE WHEN sp.reg_add = '2' AND sv.slave_id = '3' THEN sv.value END) AS "y",
			MAX(CASE WHEN sp.reg_add = '4' AND sv.slave_id = '3' THEN sv.value END) AS "b",
			MAX(CASE WHEN sp.reg_add = '56' AND sv.slave_id = '3' THEN sv.value END) AS "frequency",
			MAX(CASE WHEN sp.reg_add = '2' AND sv.slave_id = '2' THEN sv.value END) AS "ph",
			MAX(CASE WHEN sp.reg_add = '3' AND sv.slave_id = '2' THEN sv.value END) AS "temperature",
			MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '7' THEN sv.value END) AS "weight",
			MAX(CASE WHEN sp.reg_add = '0' AND sv.slave_id = '8' THEN sv.value END) AS "moisture",
			MAX(CASE WHEN sp.reg_add = '1' AND sv.slave_id = '8' THEN sv.value END) AS "humidity",
			MAX(sv.d_ttime) AS "dtime",
			MAX(sv.u_time) AS "u_time"
		FROM
			sensor_value sv
		JOIN
			sensor_parameters sp ON sv.device_id = sp.device_id AND sv.slave_id = sp.slave_id AND sv.reg_add = sp.reg_add
		GROUP BY
			sv.device_id, sv.d_ttime
		ORDER BY
			sv.device_id, "dtime" DESC;
		`);
		res.status(200).json(result.rows);
	} catch (err) {
		console.log(err.message);
		res.status(500).json({ error: err.message });
	}
});

//create a todo
app.post("/api/v1/todo", async (req, res) => {
	try {
		const { user_name, description, end_date } = req.body;
		const newTodo = await db.query(
			"INSERT INTO todo (user_name, description,end_date) VALUES($1, $2,$3) RETURNING *",
			[user_name, description, end_date]
		);

		res.json(newTodo.rows[0]);
		console.log(req.body);
	} catch (err) {
		console.error(err.message);
	}
});

// Update a todo's completion status
app.put("/api/v1/todo/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { completed } = req.body;

		const updateTodo = await db.query(
			"UPDATE todo SET completed = $1 WHERE todo_id = $2 RETURNING *",
			[completed, id]
		);

		res.json(updateTodo.rows[0]);
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

//get all todos

app.get("/api/v1/todo", async (req, res) => {
	try {
		const allTodos = await db.query("SELECT * FROM todo");
		res.json(allTodos.rows);
	} catch (err) {
		console.error(err.message);
	}
});

//delete a todo

app.delete("/api/v1/todo/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const deleteTodo = await db.query("DELETE FROM todo WHERE todo_id = $1", [
			id,
		]);
		res.json("Todo was deleted!");
	} catch (err) {
		console.log(err.message);
	}
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});
