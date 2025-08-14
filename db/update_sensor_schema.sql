-- Comprehensive sensor parameter update for device 1368
-- This script restructures the sensor parameters to properly handle multiple sensor values

-- Step 1: Remove existing sensor parameters for device 1368 (except Weight)
DELETE FROM SENSOR_PARAMETERS 
WHERE DEVICE_ID = '1368' AND SLAVE_ID IN ('1', '2');

-- Step 2: Insert methane sensors with proper mapping
-- Each methane sensor will have its own register address to handle multiple values
INSERT INTO SENSOR_PARAMETERS (SLAVE_ID, DEVICE_ID, REG_ADD, KEYS, MINVALUE, MAXVALUE, SIUNIT, DESCRIPTION) VALUES
('1', '1368', '0_1', 'Methane1', 0, 100, '%', 'Methane Level 1'),
('1', '1368', '0_2', 'Methane2', 0, 100, '%', 'Methane Level 2'),
('1', '1368', '0_3', 'Methane3', 0, 100, '%', 'Methane Level 3'),
('1', '1368', '0_4', 'Methane4', 0, 100, '%', 'Methane Level 4'),
('1', '1368', '0_5', 'Methane5', 0, 100, '%', 'Methane Level 5'),
('1', '1368', '0_6', 'Methane6', 0, 100, '%', 'Methane Level 6');

-- Step 3: Insert pH sensors with proper mapping
INSERT INTO SENSOR_PARAMETERS (SLAVE_ID, DEVICE_ID, REG_ADD, KEYS, MINVALUE, MAXVALUE, SIUNIT, DESCRIPTION) VALUES
('2', '1368', '0_1', 'pH1', 0, 14, 'pH', 'pH Level 1'),
('2', '1368', '0_2', 'pH2', 0, 14, 'pH', 'pH Level 2'),
('2', '1368', '0_3', 'pH3', 0, 14, 'pH', 'pH Level 3'),
('2', '1368', '0_4', 'pH4', 0, 14, 'pH', 'pH Level 4');

-- Step 4: Verify the new structure
SELECT 'New sensor parameter structure for device 1368:' as info;
SELECT 
    SLAVE_ID,
    REG_ADD,
    KEYS,
    SIUNIT,
    DESCRIPTION
FROM SENSOR_PARAMETERS 
WHERE DEVICE_ID = '1368' 
ORDER BY SLAVE_ID, REG_ADD;

-- Step 5: Show sensor count by type
SELECT 'Sensor count by type:' as info;
SELECT 
    CASE 
        WHEN SLAVE_ID = '1' THEN 'Methane Sensors'
        WHEN SLAVE_ID = '2' THEN 'pH Sensors'
        WHEN SLAVE_ID = '7' THEN 'Weight Sensor'
        ELSE 'Other'
    END as sensor_type,
    COUNT(*) as count
FROM SENSOR_PARAMETERS 
WHERE DEVICE_ID = '1368' 
GROUP BY SLAVE_ID
ORDER BY SLAVE_ID;
