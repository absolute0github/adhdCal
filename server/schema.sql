-- ADHDCal Database Schema
-- Created: 2026-03-15
-- For: MariaDB/MySQL

CREATE DATABASE IF NOT EXISTS adhdcal;
USE adhdcal;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supabase_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  google_refresh_token TEXT,
  google_token_expires_at DATETIME,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at DATETIME,
  suspended_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_minutes INT DEFAULT 30,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  due_date DATE,
  calendar_event_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  work_start_time TIME DEFAULT '09:00:00',
  work_end_time TIME DEFAULT '17:00:00',
  preferred_session_minutes INT DEFAULT 60,
  buffer_minutes INT DEFAULT 15,
  working_days JSON,
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
