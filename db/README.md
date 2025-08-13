# Biogas Database Setup

This directory contains the database schema and setup scripts for the Biogas monitoring system.

## Files

- `db.sql` - Main database schema with tables, indexes, and initial data
- `setup_database.js` - Node.js script to set up the database
- `reset_database.js` - Node.js script to reset the database (delete all data)
- `dbconnect.js` - Database connection module for the application

## Database Schema

### Tables

1. **user_details** - User accounts and authentication
2. **user_role_management** - User roles and permissions
3. **device** - Biogas plant devices
4. **device_management** - Device access control
5. **sensor_parameters** - Sensor configuration and metadata
6. **sensor_value** - Sensor readings and data
7. **todo** - Task management

### Views

- **dashboard_data** - Aggregated sensor data for dashboard display

### Indexes

- Performance indexes on frequently queried columns
- Composite indexes for sensor data queries

## Setup Instructions

### Prerequisites

1. PostgreSQL installed and running
2. Database "biogas" created
3. Environment variables configured in `.env` file

### Environment Variables

Make sure your `.env` file contains:

```env
PG_USER=postgres
PG_PASSWORD=postgres
PG_HOST=localhost
PG_PORT=5432
PG_DB=biogas
```

### Initial Setup

```bash
# Navigate to the db directory
cd /root/biogas/Biogas-Backend/db

# Set up the database (creates tables, indexes, and initial data)
node setup_database.js
```

### Reset Database

```bash
# WARNING: This will delete all data!
node reset_database.js

# Then recreate the schema
node setup_database.js
```

### Manual SQL Execution

If you prefer to run SQL manually:

```bash
# Connect to PostgreSQL
psql -U postgres -d biogas

# Execute the schema file
\i db.sql
```

## Sensor Parameters

The system is configured for the following sensors:

| Slave ID | Register | Parameter | Unit | Range |
|----------|----------|-----------|------|-------|
| 3 | 0 | R Phase Voltage | Volts | 0-1000 |
| 3 | 2 | Y Phase Voltage | Volts | 0-1000 |
| 3 | 4 | B Phase Voltage | Volts | 0-1000 |
| 3 | 56 | Frequency | Hz | 0-100 |
| 2 | 2 | pH Level | Value | 0-14 |
| 2 | 3 | Temperature | °C | -10-100 |
| 7 | 0 | Weight | KG | 0-5000 |
| 8 | 0 | Moisture | % | 0-100 |
| 8 | 1 | Humidity | % | 0-100 |

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if PostgreSQL is running
2. **Authentication failed**: Verify username/password in .env
3. **Database doesn't exist**: Create the database first
4. **Permission denied**: Check database user permissions

### Verification

After setup, verify the database:

```sql
-- Check tables
\dt

-- Check data
SELECT COUNT(*) FROM device;
SELECT COUNT(*) FROM sensor_parameters;
SELECT COUNT(*) FROM user_details;

-- Test dashboard view
SELECT * FROM dashboard_data LIMIT 1;
```

## Performance

The database includes:
- Indexes on frequently queried columns
- Optimized table structure
- Dashboard view for efficient data retrieval
- Proper foreign key constraints

## Backup and Restore

```bash
# Backup
pg_dump -U postgres -d biogas > backup.sql

# Restore
psql -U postgres -d biogas < backup.sql
``` 