# GPOS Deployment Guide

## 1. System Requirements
- **OS**: Windows, Linux, or macOS
- **Web Server**: Apache or Nginx
- **PHP**: Version 8.2 or higher
    - Extensions: `pdo_mysql`, `gd`, `mbstring`, `curl`
- **Database**: MySQL 8.0 or MariaDB
- **Node.js**: v18+ (for building frontend)

## 2. Backend Setup
1.  **Clone Source**: Copy the project files to your web server root (e.g., `C:\xampp\htdocs\sparx`).
2.  **Database Config**:
    - Edit `api/config/database.php`.
    - Update `$host`, `$db_name`, `$username`, and `$password` as needed.
3.  **Initialize Database**:
    - Import `database/schema.sql` into MySQL.
    - Run `php api/setup_settings_table.php` to create the settings table.

## 3. Frontend Setup
**Option A: One-Click Script (Windows)**
1.  Run `build_frontend.bat` from the project root.

**Option B: Manual Setup**
1.  **Install Dependencies**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Build Board**:
    ```bash
    npm run build
    ```
    This creates a `dist` folder containing the optimized production files.
3.  **Serve**:
    - Copy the contents of `frontend/dist` to the web root if serving purely static.
    - OR configure Apache to rewrite requests to index.html for SPA routing.

## 4. Apache VHost Example
```apache
<VirtualHost *:80>
    DocumentRoot "C:/xampp/htdocs/sparx/frontend/dist"
    ServerName gpos.local

    <Directory "C:/xampp/htdocs/sparx/frontend/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA Routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # API Proxy
    ProxyPass /api http://localhost/sparx/api
    ProxyPassReverse /api http://localhost/sparx/api
</VirtualHost>
```

## 5. Security Checklist
- [ ] Change default Admin password.
- [ ] Disable directory listing in Apache.
- [ ] Ensure `api/config/database.php` is not accessible via web.
- [ ] Enable SSL (HTTPS) for production.
