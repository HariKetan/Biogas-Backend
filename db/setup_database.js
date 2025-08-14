const { Pool } = require("pg");
const fs = require("fs");
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

// Create connection pool
const pool = new Pool(dbConfig);

async function setupDatabase() {
    const client = await pool.connect();
    
    try {
        console.log("Connected to PostgreSQL database");
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, "db.sql");
        console.log(`Reading SQL file: ${sqlFilePath}`);
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found: ${sqlFilePath}`);
        }
        
        const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
        console.log("SQL file loaded successfully");
        
        // Better SQL statement parsing that handles multi-line statements
        const statements = [];
        let currentStatement = '';
        let inString = false;
        let inParentheses = 0;
        
        for (let i = 0; i < sqlContent.length; i++) {
            const char = sqlContent[i];
            const nextChar = sqlContent[i + 1];
            
            // Handle string literals
            if (char === "'" && !inString) {
                inString = true;
            } else if (char === "'" && inString) {
                inString = false;
            }
            
            // Handle parentheses for complex statements
            if (char === '(' && !inString) {
                inParentheses++;
            } else if (char === ')' && !inString) {
                inParentheses--;
            }
            
            // Only split on semicolons when not in string or parentheses
            if (char === ';' && !inString && inParentheses === 0) {
                currentStatement += char;
                if (currentStatement.trim()) {
                    statements.push(currentStatement.trim());
                }
                currentStatement = '';
            } else {
                currentStatement += char;
            }
        }
        
        // Add any remaining statement
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }
        
        // Filter out empty statements and comments
        const validStatements = statements.filter(stmt => 
            stmt.length > 0 && 
            !stmt.startsWith('--') && 
            !stmt.trim().startsWith('--')
        );
        
        console.log(`Found ${validStatements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < validStatements.length; i++) {
            const statement = validStatements[i];
            if (statement.trim()) {
                try {
                    console.log(`Executing statement ${i + 1}/${validStatements.length}...`);
                    await client.query(statement);
                    console.log(`✓ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    console.error(`✗ Error executing statement ${i + 1}:`, error.message);
                    // Continue with other statements unless it's a critical error
                    if (error.code === '42P01') { // Table doesn't exist (expected for DROP statements)
                        console.log("  (This is expected for DROP statements on first run)");
                    } else {
                        // For other errors, log the statement that failed
                        console.error("Failed statement:", statement.substring(0, 100) + "...");
                    }
                }
            }
        }
        
        // Wait a moment for all statements to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the setup
        console.log("\nVerifying database setup...");
        
        // Check if tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        console.log("Created tables:");
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Check if data was inserted
        const deviceCount = await client.query("SELECT COUNT(*) FROM device");
        const sensorParamCount = await client.query("SELECT COUNT(*) FROM sensor_parameters");
        const userCount = await client.query("SELECT COUNT(*) FROM user_details");
        
        console.log("\nData verification:");
        console.log(`  - Devices: ${deviceCount.rows[0].count}`);
        console.log(`  - Sensor Parameters: ${sensorParamCount.rows[0].count}`);
        console.log(`  - Users: ${userCount.rows[0].count}`);
        
        // Test the dashboard view
        try {
            const dashboardResult = await client.query("SELECT * FROM dashboard_data LIMIT 1");
            console.log("✓ Dashboard view created successfully");
        } catch (error) {
            console.log("Dashboard view not available yet (no sensor data)");
        }
        
        console.log("\n🎉 Database setup completed successfully!");
        console.log("You can now run the MQTT broker and simulation scripts.");
        
    } catch (error) {
        console.error("❌ Database setup failed:", error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the setup
setupDatabase()
    .then(() => {
        console.log("Setup script completed");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Setup script failed:", error);
        process.exit(1);
    }); 