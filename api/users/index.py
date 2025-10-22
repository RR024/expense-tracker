from http.server import BaseHTTPRequestHandler
import json
import csv
import os
from datetime import datetime
from urllib.parse import urlparse

USERS_FILE = 'backend/users.csv'

class handler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
        
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        # Login
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
            
        # Signup
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
    
    def signup_user(self, data):
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not username or not email or not password:
            return {'success': False, 'message': 'All fields are required'}
        
        # Simple file-based storage (for demo - use database in production)
        file_exists = os.path.exists(USERS_FILE)
        
        if file_exists:
            with open(USERS_FILE, 'r', newline='', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for user in reader:
                    if user['email'].lower() == email.lower():
                        return {'success': False, 'message': 'Email already registered'}
                    if user['username'].lower() == username.lower():
                        return {'success': False, 'message': 'Username already taken'}
        
        with open(USERS_FILE, 'a', newline='', encoding='utf-8') as file:
            fieldnames = ['username', 'email', 'password', 'created_at']
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            
            if not file_exists:
                writer.writeheader()
            
            writer.writerow({
                'username': username,
                'email': email,
                'password': password,
                'created_at': datetime.now().isoformat()
            })
        
        return {
            'success': True,
            'message': 'Account created successfully',
            'user': {'username': username, 'email': email}
        }
    
    def login_user(self, data):
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return {'success': False, 'message': 'Username and password required'}
        
        if not os.path.exists(USERS_FILE):
            return {'success': False, 'message': 'Invalid credentials'}
        
        with open(USERS_FILE, 'r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for user in reader:
                if user['username'] == username and user['password'] == password:
                    return {
                        'success': True,
                        'message': 'Login successful',
                        'user': {'username': user['username'], 'email': user['email']}
                    }
        
        return {'success': False, 'message': 'Invalid credentials'}
