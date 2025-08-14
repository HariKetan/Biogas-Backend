const { Pool } = require("pg");
const { spawn } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
    user: process.env.PG_USER || "biogas",
    password: process.env.PG_PASSWORD || "biogas",
    host: process.env.PG_HOST || "localhost",
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DB || "biogas"
};

console.log("Database configuration:", {
    user: dbConfig.user,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database
});

async function setupDatabase() {
    try {
        console.log("Setting up database using psql...");
        
        // Get the SQL file path
        const sqlFilePath = path.join(__dirname, "db.sql");
        console.log(`SQL file path: ${sqlFilePath}`);
        
        if (!require('fs').existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found: ${sqlFilePath}`);
        }
        
        // Execute SQL file using psql
        return new Promise((resolve, reject) => {
            const psql = spawn('psql', [
                '-U', dbConfig.user,
                '-h', dbConfig.host,
                '-p', dbConfig.port,
                '-d', dbConfig.database,
                '-f', sqlFilePath
            ], {
                stdio: 'pipe',
                env: { ...process.env, PGPASSWORD: dbConfig.password }
            });
            
            let stdout = '';
            let stderr = '';
            
            psql.stdout.on('data', (data) => {
                stdout += data.toString();
                console.log(data.toString());
            });
            
            psql.stderr.on('data', (data) => {
                stderr += data.toString();
                console.error(data.toString());
            });
            
            psql.on('close', (code) => {
                if (code === 0) {
                    console.log("✅ SQL file executed successfully");
                    resolve();
                } else {
                    console.error(`❌ psql exited with code ${code}`);
                    reject(new Error(`psql failed with code ${code}`));
                }
            });
            
            psql.on('error', (error) => {
                console.error("❌ Failed to start psql:", error.message);
                reject(error);
            });
        });
        
    } catch (error) {
        console.error("❌ Database setup failed:", error);
        throw error;
    }
}

// Run the setup
setupDatabase()
    .then(() => {
        console.log("\n🎉 Database setup completed successfully!");
        console.log("You can now run the MQTT broker and simulation scripts.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Setup script failed:", error);
        process.exit(1);
    }); 