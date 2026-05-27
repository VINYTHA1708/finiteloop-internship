-- ====================================================================
-- Expense Tracker - Personal Finance Management System
-- Database Schema & Sample Data Setup Script (MySQL / MariaDB Compatible)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `expense_tracker`;
USE `expense_tracker`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UK_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` BIGINT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(255) NOT NULL,
  `budget_limit` DOUBLE NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `UK_categories_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Expenses Table
CREATE TABLE IF NOT EXISTS `expenses` (
  `expense_id` BIGINT NOT NULL AUTO_INCREMENT,
  `amount` DOUBLE NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `payment_method` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `user_id` BIGINT NOT NULL,
  `category_id` BIGINT NOT NULL,
  PRIMARY KEY (`expense_id`),
  KEY `FK_expenses_user` (`user_id`),
  KEY `FK_expenses_category` (`category_id`),
  CONSTRAINT `FK_expenses_category_id` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_expenses_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- Sample Seeds (Default Configurations & Sandbox Data)
-- ====================================================================

-- Seed Standard Categories
INSERT INTO `categories` (`category_id`, `category_name`, `budget_limit`) VALUES
(1, 'Food', 5000.00),
(2, 'Travel', 3000.00),
(3, 'Shopping', 10000.00),
(4, 'Bills', 8000.00),
(5, 'Education', 15000.00)
ON DUPLICATE KEY UPDATE `budget_limit` = VALUES(`budget_limit`);

-- Seed Sandbox User
-- Creds: Sandbox Account (email: sandbox@finiteloop.com, pwd: password123)
-- BCrypt Hashed Password generated: '$2a$10$tZ9sA12H2/K3P/lE7eBwH.75X67/7G0pEwX8oO3wWjU9D3dY7k/a.'
INSERT INTO `users` (`user_id`, `name`, `email`, `password`) VALUES
(1, 'Sandbox Account', 'sandbox@finiteloop.com', '$2a$10$vDpx21l5qS4w.9lKqj9oDeVzL6r.yL2sUeN6pC1304N08q3kQ3vG.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Seed Default Expense Records for Sandbox User
INSERT INTO `expenses` (`expense_id`, `amount`, `description`, `date`, `payment_method`, `created_at`, `user_id`, `category_id`) VALUES
(1, 150.00, 'Morning Coffee & Bagel', '2026-05-20', 'Cash', '2026-05-20 08:30:00', 1, 1),
(2, 1200.00, 'Uber rides to office client meeting', '2026-05-21', 'Card', '2026-05-21 14:15:00', 1, 2),
(3, 4500.00, 'Summer clothing & shoes', '2026-05-22', 'Card', '2026-05-22 18:45:00', 1, 3),
(4, 3200.00, 'Electricity bill payment', '2026-05-24', 'UPI', '2026-05-24 10:00:00', 1, 4),
(5, 7500.00, 'Java Programming Certification Course', '2026-05-25', 'Net Banking', '2026-05-25 11:30:00', 1, 5)
ON DUPLICATE KEY UPDATE `amount` = VALUES(`amount`);
