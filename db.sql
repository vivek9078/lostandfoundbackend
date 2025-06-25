CREATE DATABASE IF NOT EXISTS lostfounddb;
USE lostfounddb;

-- Table for found items
CREATE TABLE IF NOT EXISTS found_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255),
  item_name VARCHAR(255),
  color VARCHAR(50),
  brand VARCHAR(100),
  location VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_by VARCHAR(255) DEFAULT NULL
);

-- Table for lost items (claiming is usually not applicable, but you can add if needed)
CREATE TABLE IF NOT EXISTS lost_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255),
  item_name VARCHAR(255),
  color VARCHAR(50),
  brand VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE
);
