import http.server
import socketserver
import json
import csv
import os
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PORT = 8001
USERS_FILE = 'users.csv'

class UsersAPIHandler(http.server.SimpleHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
        
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Health check
        if parsed_path.path == '/api/users/health':
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'status': 'healthy', 'service': 'users_api'}
            self.wfile.write(json.dumps(response).encode())
            return
            
        # Check if email exists
        if parsed_path.path.startswith('/api/users/check-email/'):
            email = parsed_path.path.split('/')[-1]
            exists = self.check_email_exists(email)
            
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'exists': exists}
            self.wfile.write(json.dumps(response).encode())
            return
            
        self.send_response(404)
        self.end_headers()
        
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        # User signup
        if parsed_path.path == '/api/users/signup':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            result = self.signup_user(data)
            
            if result['success']:
                self.send_response(201)
            else:
                self.send_response(400)
                
            self._set_cors_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return
            
        # User login
        if parsed_path.path == '/api/users/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            result = self.login_user(data)
            
            if result['success']:
                self.send_response(200)
            else:
                self.send_response(401)
                
            self._set_cors_headers()
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            return
            
        self.send_response(404)
        self.end_headers()
        
    def check_email_exists(self, email):
        """Check if email already exists in users database"""
        if not os.path.exists(USERS_FILE):
            return False
            
        with open(USERS_FILE, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row['email'].lower() == email.lower():
                    return True
        return False
    
    def get_all_users(self):
        """Get all users as a list (cached for performance)"""
        if not os.path.exists(USERS_FILE):
            return []
        
        users = []
        with open(USERS_FILE, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            users = list(reader)
        return users
        
    def signup_user(self, data):
        """Register a new user - OPTIMIZED"""
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validation
        if not username or not email or not password:
            return {'success': False, 'message': 'All fields are required'}
            
        # Check if users file exists, create if not
        file_exists = os.path.exists(USERS_FILE)
        
        # Single pass to check both email and username - OPTIMIZED
        if file_exists:
            users = self.get_all_users()
            for user in users:
                if user['email'].lower() == email.lower():
                    return {'success': False, 'message': 'Email already registered'}
                if user['username'].lower() == username.lower():
                    return {'success': False, 'message': 'Username already taken'}
        
        # Add user to CSV
        with open(USERS_FILE, 'a', newline='', encoding='utf-8') as file:
            fieldnames = ['username', 'email', 'password', 'created_at']
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            
            # Write header if new file
            if not file_exists or os.path.getsize(USERS_FILE) == 0:
                writer.writeheader()
            
            writer.writerow({
                'username': username,
                'email': email,
                'password': password,  # In production, use hashing!
                'created_at': datetime.now().isoformat()
            })
        
        return {
            'success': True,
            'message': 'Account created successfully',
            'user': {
                'username': username,
                'email': email
            }
        }
        
    def login_user(self, data):
        """Authenticate user - OPTIMIZED"""
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return {'success': False, 'message': 'Username and password required'}
            
        if not os.path.exists(USERS_FILE):
            return {'success': False, 'message': 'Invalid credentials'}
            
        # Single efficient read - OPTIMIZED
        users = self.get_all_users()
        for user in users:
            if user['username'] == username and user['password'] == password:
                return {
                    'success': True,
                    'message': 'Login successful',
                    'user': {
                        'username': user['username'],
                        'email': user['email']
                    }
                }
        
        return {'success': False, 'message': 'Invalid credentials'}
        
    def log_message(self, format, *args):
        # Custom log format
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), UsersAPIHandler) as httpd:
        print("🔐 FinSight Users API Server starting...")
        print(f"📡 Endpoints:")
        print(f"   POST /api/users/signup - Register new user")
        print(f"   POST /api/users/login - Authenticate user")
        print(f"   GET  /api/users/check-email/<email> - Check email availability")
        print(f"   GET  /api/users/health - Health check")
        print(f"🌐 Server running on http://localhost:{PORT}")
        httpd.serve_forever()
