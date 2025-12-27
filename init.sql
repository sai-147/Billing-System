-- Create database
CREATE DATABASE IF NOT EXISTS Billing;
USE Billing;

-- Create user
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON Billing.* TO 'appuser'@'%';
FLUSH PRIVILEGES;

use Billing;



-- =========================
-- 1️⃣ MASTER TABLES
-- =========================

CREATE TABLE IF NOT EXISTS Tax (
    HSN VARCHAR(10) PRIMARY KEY,
    SGST DECIMAL(5,2) NOT NULL,
    CGST DECIMAL(5,2) NOT NULL,
    IGST DECIMAL(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS Customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Company_Name VARCHAR(100) NOT NULL,
    Billing_Address_Line_1 TEXT,
    Billing_Address_Line_2 TEXT,
    Billing_Address_Line_3 TEXT,
    GSTIN CHAR(15) UNIQUE,
    State VARCHAR(50),
    State_Code CHAR(2),
    Shipping_Address_Line_1 TEXT,
    Shipping_Address_Line_2 TEXT,
    Shipping_Address_Line_3 TEXT,
    Phone VARCHAR(15),
    Email VARCHAR(100),
    GPS VARCHAR(30),
    CIN_No VARCHAR(50),
    Shipping_State VARCHAR(50),
    Shipping_State_Code CHAR(2),
    Pan_no CHAR(10)
);

CREATE TABLE IF NOT EXISTS Firm_Table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Firm_name VARCHAR(100) NOT NULL,
    Address_Line_1 TEXT,
    Address_Line_2 TEXT,
    Address_Line_3 TEXT,
    Pan_no CHAR(10) UNIQUE NOT NULL,
    Bank_Name VARCHAR(100),
    Bank_Account_No VARCHAR(20),
    Bank_Branch_IFSC CHAR(11),
    Bank_Branch VARCHAR(100),
    Phone VARCHAR(15),
    email VARCHAR(100),
    GSTIN CHAR(15),
    State VARCHAR(50),
    State_Code CHAR(2),
    Proprietary_Name VARCHAR(100),
    Proprietary_Phone VARCHAR(15),
    Proprietary_Email VARCHAR(100),
    GPS VARCHAR(30),
    Supply_Place VARCHAR(100),
    CIN_No VARCHAR(50)
);

-- =========================
-- 2️⃣ DEPENDENT TABLES (NO FK YET)
-- =========================

CREATE TABLE IF NOT EXISTS Parts (
    Part_No VARCHAR(50) PRIMARY KEY,
    Part_Name VARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    HSN VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS Invoices (
    Invoice_No VARCHAR(30) PRIMARY KEY,
    Invoice_Date DATE NOT NULL,
    Buyer_Order_Date DATE,
    Challan_Date DATE,
    E_Way_Bill_No VARCHAR(30),
    Customer_Id INT NOT NULL,
    CIN_No VARCHAR(25),
    Challan_No VARCHAR(30),
    Cart_Id INT,
    SGST_Included TINYINT(1) DEFAULT 0,
    CGST_Included TINYINT(1) DEFAULT 0,
    IGST_Included TINYINT(1) DEFAULT 0,
    Bins INT,
    Bags INT,
    Vehicle_No VARCHAR(20),
    Sub_Total DECIMAL(12,2) NOT NULL,
    Transporter_Name VARCHAR(50),
    Buyer_Order_No VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS Cart (
    Cart_Id INT AUTO_INCREMENT PRIMARY KEY,
    Invoice_No VARCHAR(30) NOT NULL,
    Part_No VARCHAR(50) NOT NULL,
    Qty INT NOT NULL
);

-- =========================
-- 3️⃣ FOREIGN KEY CONSTRAINTS
-- =========================

-- Parts → Tax
ALTER TABLE Parts
ADD CONSTRAINT fk_parts_tax
FOREIGN KEY (HSN) REFERENCES Tax(HSN);

-- Invoices → Customer
ALTER TABLE Invoices
ADD CONSTRAINT fk_invoice_customer
FOREIGN KEY (Customer_Id) REFERENCES Customer(id);

-- Invoices → Cart
ALTER TABLE Invoices
ADD CONSTRAINT fk_invoice_cart
FOREIGN KEY (Cart_Id) REFERENCES Cart(Cart_Id);

-- Cart → Invoices
ALTER TABLE Cart
ADD CONSTRAINT fk_cart_invoice
FOREIGN KEY (Invoice_No)
REFERENCES Invoices(Invoice_No)
ON DELETE CASCADE;

-- Cart → Parts
ALTER TABLE Cart
ADD CONSTRAINT fk_cart_part
FOREIGN KEY (Part_No)
REFERENCES Parts(Part_No);
