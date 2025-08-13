-- Biogas Database Schema
-- Create Tables

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS SENSOR_VALUE CASCADE;
DROP TABLE IF EXISTS SENSOR_PARAMETERS CASCADE;
DROP TABLE IF EXISTS DEVICE_MANAGEMENT CASCADE;
DROP TABLE IF EXISTS DEVICE CASCADE;
DROP TABLE IF EXISTS user_role_management CASCADE;
DROP TABLE IF EXISTS user_details CASCADE;
DROP TABLE IF EXISTS todo CASCADE;

-- Create user_details table
CREATE TABLE user_details (
    uid SERIAL PRIMARY KEY, 
    name VARCHAR(30) NOT NULL, 
    password VARCHAR(30) NOT NULL, 
    address VARCHAR(50), 
    mobile VARCHAR(10), 
    email VARCHAR(40) UNIQUE
);

-- Create user_role_management table
CREATE TABLE user_role_management (
    rid SERIAL,
    uid INT,
    admin_id INT,
    ROLE VARCHAR(10),
    FOREIGN KEY (uid) REFERENCES user_details (uid),
    FOREIGN KEY (admin_id) REFERENCES user_details (uid),
    PRIMARY KEY (rid, uid)
);

-- Create DEVICE table
CREATE TABLE DEVICE (
    DEVICE_ID VARCHAR(20) PRIMARY KEY,
    LOGITUDE VARCHAR(20),
    LATITUDE VARCHAR(20),
    DESCRIPTION VARCHAR(50),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create DEVICE_MANAGEMENT table
CREATE TABLE DEVICE_MANAGEMENT (
    UID INT,
    DEVICE_ID VARCHAR(20),
    ACCESS BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (UID, DEVICE_ID),
    FOREIGN KEY (UID) REFERENCES user_details (uid),
    FOREIGN KEY (DEVICE_ID) REFERENCES DEVICE (DEVICE_ID)
);

-- Create SENSOR_PARAMETERS table
CREATE TABLE SENSOR_PARAMETERS (
    SLAVE_ID VARCHAR(10),
    DEVICE_ID VARCHAR(20),
    REG_ADD VARCHAR(10),
    KEYS VARCHAR(40) NOT NULL,
    MINVALUE INT DEFAULT 0,
    MAXVALUE INT DEFAULT 1000,
    SIUNIT VARCHAR(5),
    DESCRIPTION TEXT,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (DEVICE_ID) REFERENCES DEVICE (DEVICE_ID),
    PRIMARY KEY (DEVICE_ID, REG_ADD, SLAVE_ID)
);

-- Create SENSOR_VALUE table
CREATE TABLE SENSOR_VALUE (
    DEVICE_ID VARCHAR(20),
    SLAVE_ID VARCHAR(10),
    REG_ADD VARCHAR(10),
    VALUE FLOAT NOT NULL,
    U_TIME TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    D_TTIME VARCHAR(25),
    PRIMARY KEY (DEVICE_ID, SLAVE_ID, REG_ADD, U_TIME),
    FOREIGN KEY (DEVICE_ID, REG_ADD, SLAVE_ID) REFERENCES SENSOR_PARAMETERS(DEVICE_ID, REG_ADD, SLAVE_ID)
);

-- Create todo table
CREATE TABLE todo (
    todo_id SERIAL PRIMARY KEY,
    user_name VARCHAR(30),
    description VARCHAR(255),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date DATE
);

-- Insert initial data

-- Insert admin user
INSERT INTO user_details (uid, name, password, address, mobile, email) 
VALUES (1, 'admin', 'admin123', 'RVCE', '12345678', 'admin@gmail.com')
ON CONFLICT (uid) DO NOTHING;

-- Insert device
INSERT INTO DEVICE (DEVICE_ID, LOGITUDE, LATITUDE, DESCRIPTION) 
VALUES ('1014', '190273', '029380', 'Biogas Plant Location')
ON CONFLICT (DEVICE_ID) DO NOTHING;

-- Insert sensor parameters
INSERT INTO SENSOR_PARAMETERS (SLAVE_ID, DEVICE_ID, REG_ADD, KEYS, MINVALUE, MAXVALUE, SIUNIT, DESCRIPTION) VALUES
('3', '1014', '0', 'R', 0, 1000, 'Volts', 'R Phase Voltage'),
('3', '1014', '2', 'Y', 0, 1000, 'Volts', 'Y Phase Voltage'),
('3', '1014', '4', 'B', 0, 1000, 'Volts', 'B Phase Voltage'),
('3', '1014', '56', 'Frequency', 0, 100, 'Hz', 'Power Frequency'),
('2', '1014', '2', 'pH', 0, 14, 'Value', 'pH Level'),
('2', '1014', '3', 'Temperature', -10, 100, '°C', 'Temperature'),
('7', '1014', '0', 'Weight', 0, 5000, 'KG', 'Weight Measurement'),
('8', '1014', '0', 'Moisture', 0, 100, '%', 'Moisture Content'),
('8', '1014', '1', 'Humidity', 0, 100, '%', 'Humidity Level')
ON CONFLICT (DEVICE_ID, REG_ADD, SLAVE_ID) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_value_device_time ON SENSOR_VALUE(DEVICE_ID, U_TIME);
CREATE INDEX IF NOT EXISTS idx_sensor_value_slave_reg ON SENSOR_VALUE(SLAVE_ID, REG_ADD);
CREATE INDEX IF NOT EXISTS idx_sensor_parameters_device ON SENSOR_PARAMETERS(DEVICE_ID);

-- Create a view for dashboard data
CREATE OR REPLACE VIEW dashboard_data AS
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
    MAX(sv.d_ttime) AS "dtime",
    MAX(sv.u_time) AS "u_time"
FROM
    sensor_value sv
JOIN
    sensor_parameters sp ON sv.device_id = sp.device_id AND sv.slave_id = sp.slave_id AND sv.reg_add = sp.reg_add
WHERE
    sv.device_id = '1014'
GROUP BY
    sv.device_id, sv.d_ttime
ORDER BY
    "dtime" DESC;

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO biogas;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO biogas;

-- Display table information
SELECT 'Database setup completed successfully!' as status;
