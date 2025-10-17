from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse
import pandas as pd
from datetime import datetime
import os
import json

PORT = 8000

class SimpleRequestHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        """Set CORS headers to allow requests from React app"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Get all transactions for a user"""
        if self.path.startswith('/api/transactions/'):
            username = self.path.split('/')[-1]
            filename = f"user_{username}.csv"
            
            if os.path.exists(filename):
                df = pd.read_csv(filename)
                # Replace NaN values with empty strings for JSON compatibility
                df = df.fillna('')
                transactions = df.to_dict('records')
                
                response = json.dumps({
                    'success': True,
                    'data': transactions
                }).encode('utf-8')
                
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response)))
                self.end_headers()
                self.wfile.write(response)
            else:
                response = json.dumps({
                    'success': True,
                    'data': []
                }).encode('utf-8')
                
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response)))
                self.end_headers()
                self.wfile.write(response)
        else:
            # Return API info
            response = json.dumps({
                'message': 'FinSight API Server',
                'endpoints': {
                    'GET': '/api/transactions/{username}',
                    'POST': '/api/transactions'
                }
            }).encode('utf-8')
            
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(response)

    def do_POST(self):
        """Handle transaction submission"""
        if self.path == '/api/transactions':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                username = data.get('username', '')
                merchant = data.get('merchant', '')
                amount = data.get('amount', '')
                category = data.get('category', '')
                mood = data.get('mood', 'Neutral')
                location = data.get('location', '')
                calendar_event = data.get('calendar', 'Regular')

                date = datetime.now().strftime("%Y-%m-%d")
                time = datetime.now().strftime("%H:%M:%S")

                # Read existing file to get last balance
                filename = f"user_{username}.csv"
                last_balance = 0
                if os.path.exists(filename):
                    try:
                        existing_df = pd.read_csv(filename)
                        if not existing_df.empty and 'Balance_After' in existing_df.columns:
                            last_balance = existing_df['Balance_After'].iloc[-1]
                    except:
                        last_balance = 0

                # Calculate new balance (subtract expense or add income)
                new_balance = last_balance
                if category == 'Salary' or category == 'Income':
                    new_balance = last_balance + float(amount)
                else:
                    new_balance = last_balance - float(amount)

                new_data = pd.DataFrame([{
                    "Date": date,
                    "Time": time,
                    "Merchant": merchant,
                    "Amount": amount,
                    "Category": category,
                    "Mood": mood,
                    "Location": location,
                    "Calendar_Event": calendar_event,
                    "Group_ID": 1,
                    "Balance_After": new_balance
                }])

                if os.path.exists(filename):
                    new_data.to_csv(filename, mode='a', header=False, index=False)
                else:
                    new_data.to_csv(filename, index=False)

                response = json.dumps({
                    'success': True,
                    'message': f'Transaction saved successfully for {username}',
                    'data': new_data.to_dict('records')[0]
                }).encode('utf-8')

                self.send_response(201)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(response)))
                self.end_headers()
                self.wfile.write(response)
                
            except Exception as e:
                response = json.dumps({
                    'success': False,
                    'message': str(e)
                }).encode('utf-8')

                self.send_response(400)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response)
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    print(f"🚀 FinSight API Server running on http://localhost:{PORT}")
    print(f"📡 Endpoints:")
    print(f"   GET  /api/transactions/{{username}} - Get user transactions")
    print(f"   POST /api/transactions - Add new transaction")
    server = HTTPServer(("localhost", PORT), SimpleRequestHandler)
    server.serve_forever()
