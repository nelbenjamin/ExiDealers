const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log('🚀 Setting up database...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'nelly19801',
        database: process.env.DB_NAME || 'exidealers',
        multipleStatements: true
    });

    try {
        // ============= ONE SQL SCRIPT TO RULE THEM ALL =============
        const sql = `
            -- 1. USERS TABLE
            CREATE TABLE IF NOT EXISTS \`users\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`firstName\` VARCHAR(100) NOT NULL,
                \`lastName\` VARCHAR(100) NOT NULL,
                \`email\` VARCHAR(255) NOT NULL UNIQUE,
                \`password\` VARCHAR(255) NOT NULL,
                \`phone\` VARCHAR(50) DEFAULT NULL,
                \`profileImage\` VARCHAR(255) DEFAULT NULL,
                \`isActive\` TINYINT(1) DEFAULT 1,
                \`lastLogin\` DATETIME DEFAULT NULL,
                \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            -- 2. USER FAVORITES TABLE
            CREATE TABLE IF NOT EXISTS \`user_favorites\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`userId\` INT NOT NULL,
                \`carId\` INT NOT NULL,
                \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`unique_user_car\` (\`userId\`, \`carId\`),
                FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
                FOREIGN KEY (\`carId\`) REFERENCES \`cars\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            -- 3. USER SAVED TABLE
            CREATE TABLE IF NOT EXISTS \`user_saved\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`userId\` INT NOT NULL,
                \`carId\` INT NOT NULL,
                \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`unique_user_car_saved\` (\`userId\`, \`carId\`),
                FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
                FOREIGN KEY (\`carId\`) REFERENCES \`cars\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            -- 4. ADD MISSING COLUMNS TO USERS (if they don't exist)
            SET @dbname = DATABASE();
            
            -- Add profileImage
            SET @columnname = 'profileImage';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE users ADD COLUMN profileImage VARCHAR(255) DEFAULT NULL AFTER phone',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            -- Add isActive
            SET @columnname = 'isActive';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE users ADD COLUMN isActive TINYINT(1) DEFAULT 1 AFTER profileImage',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            -- Add lastLogin
            SET @columnname = 'lastLogin';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE users ADD COLUMN lastLogin DATETIME DEFAULT NULL AFTER isActive',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            -- Add createdAt if missing
            SET @columnname = 'createdAt';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE users ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER lastLogin',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            -- Add updatedAt if missing
            SET @columnname = 'updatedAt';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE users ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- 5. ADD USERID TO PRICE_ALERTS
            SET @columnname = 'userId';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'price_alerts' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE price_alerts ADD COLUMN userId INT NULL AFTER id, ADD FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- 6. ADD TIMESTAMPS TO CARS
            SET @columnname = 'createdAt';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'cars' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE cars ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SET @columnname = 'updatedAt';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'cars' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE cars ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- 7. ADD TIMESTAMPS TO CAR_IMAGES
            SET @columnname = 'createdAt';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'car_images' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE car_images ADD COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SET @columnname = 'updatedAt';
            SET @preparedStatement = (SELECT IF(
                (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'car_images' AND COLUMN_NAME = @columnname) = 0,
                'ALTER TABLE car_images ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt',
                'SELECT 1'
            ));
            PREPARE stmt FROM @preparedStatement;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;

            -- 8. SHOW FINAL RESULT
            SELECT '✅ DATABASE SETUP COMPLETE' as status;
            SELECT TABLE_NAME, COUNT(*) as columns FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            GROUP BY TABLE_NAME;
        `;

        console.log('📦 Running complete database setup...');
        await connection.query(sql);
        console.log('✅ Database setup completed successfully!');
        
        // Show tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('\n📊 Your tables are ready:');
        tables.forEach((table, i) => {
            const name = Object.values(table)[0];
            console.log(`   ${i+1}. ${name}`);
        });

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        await connection.end();
    }
}

setupDatabase();