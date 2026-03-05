# Sparx Motor Parts - POS System

A modern, responsive Point-of-Sale (POS) system built with React and PHP. Designed for multi-branch retail operations with thermal printing support and rigorous shift reconciliation.

## 🚀 Key Features

- **Dynamic POS Interface**: Real-time cart management with barcode scanner integration.
- **Thermal Receipt Printing**: Authenticated receipts mimicking Philippine POS standards (not BIR registered, for internal use).
- **Relational Data Integrity**: ACID-compliant transactions for sales, inventory updates, and returns.
- **Shift Management**: Full Z-Reading reporting with cash reconciliation and refund tracking.
- **Multi-Branch Support**: Branch-level data isolation for users and inventory.
- **Audit Logging**: Comprehensive activity tracking for administrative oversight.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Axios.
- **Backend**: PHP 8.x (Service-Oriented Architecture).
- **Database**: MySQL with PDO prepared statements.

## 📁 Project Structure

```text
├── api/                    # PHP RESTful endpoints
│   ├── services/           # Decoupled business logic (Classes)
│   └── config/             # DB Connection & CORS configuration
├── database/               # SQL schema and migration scripts
├── frontend/               # React application (Vite-powered)
│   ├── src/pages/          # Functional UI components
│   └── src/context/        # Global Auth & State Management
└── README.md               # You are here
```

## 🛠️ Setup Instructions

1. **Database**: Import `database/schema.sql` into your MySQL server.
2. **Backend**: Host the root directory on XAMPP or any PHP-enabled server. Update `api/config/database.php` with your credentials.
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📚 Technical Documentation

For a deep dive into the architecture, transactions, and system design, see:
- [Technical Architecture Guide](file:///C:/Users/ALIENWARE/.gemini/antigravity/brain/42df8efa-0dcc-4529-bef3-a179b629071f/technical_overview.md)
- [Sales & Refund Implementation Walkthrough](file:///C:/Users/ALIENWARE/.gemini/antigravity/brain/42df8efa-0dcc-4529-bef3-a179b629071f/walkthrough.md)
