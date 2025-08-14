const { Pool } = require("pg");
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

const pool = new Pool(dbConfig);

async function resetDatabase() {
    const client = await pool.connect();
    
    try {
        console.log("Connected to PostgreSQL database");
        console.log("⚠️  WARNING: This will delete all data in the database!");
        console.log("📋 Tables to be dropped:");
        console.log("   - SENSOR_VALUE (sensor readings)")
        console.log("   - SENSOR_PARAMETERS (sensor configuration)")
        console.log("   - DEVICE_MANAGEMENT (device access control)")
        console.log("   - DEVICE (device information)")
        console.log("   - user_role_management (user permissions)")
        console.log("   - user_details (user accounts)")
        console.log("   - todo (task management)")
        console.log("   - dashboard_data (dashboard view)")
        
        // Drop all tables in the correct order
        const dropQueries = [
            "DROP TABLE IF EXISTS SENSOR_VALUE CASCADE",
            "DROP TABLE IF EXISTS SENSOR_PARAMETERS CASCADE", 
            "DROP TABLE IF EXISTS DEVICE_MANAGEMENT CASCADE",
            "DROP TABLE IF EXISTS DEVICE CASCADE",
            "DROP TABLE IF EXISTS user_role_management CASCADE",
            "DROP TABLE IF EXISTS user_details CASCADE",
            "DROP TABLE IF EXISTS todo CASCADE",
            "DROP VIEW IF EXISTS dashboard_data CASCADE"
        ];
        
        console.log("\n🗑️  Dropping existing tables...");
        for (const query of dropQueries) {
            await client.query(query);
            console.log(`✓ Dropped: ${query}`);
        }
        
        console.log("\n✅ Database reset completed successfully!");
        console.log("💡 Next steps:");
        console.log("   1. Run 'node setup_database.js' to recreate the database schema");
        console.log("   2. The setup will include the corrected sensor parameters for device 1368");
        console.log("   3. Start the MQTT broker to begin data collection");
        
    } catch (error) {
        console.error("❌ Database reset failed:", error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the reset
resetDatabase()
    .then(() => {
        console.log("Reset script completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Reset script failed:", error);
        process.exit(1);
    }); 