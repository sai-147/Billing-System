# Billing System

A full-featured **Invoice Management System** built with Node.js, Express, and MySQL. Designed for GST-compliant billing with PDF generation and data management.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)

## ✨ Features

### Create Invoice
- Dynamic invoice creation with cart system
- GST support (SGST, CGST, IGST)
- PDF Invoice Generation
- Preview and Download last invoice

### Sales Management
- View all generated invoices
- Advanced filtering (Date range, Customer, Vehicle No, E-Way Bill)
- Sorting and search functionality
- Invoice preview and delete options

### Master Data Management
- Manage core entities:
  - **Customers**
  - **Firm Details**
  - **Parts / Products** (with HSN codes)
  - **Tax Rates**

### Technical Features
- Docker + Docker Compose support
- Responsive UI with EJS templates
- CSV Export capability
- Number to Words conversion for invoices

## 🛠 Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: EJS + CSS
- **Database**: MySQL
- **PDF**: pdfkit
- **Container**: Docker

## 🚀 How to Run

### Using Docker (Recommended)

```bash
git clone https://github.com/sai-147/Billing-System.git
cd Billing-System
docker-compose up --build
