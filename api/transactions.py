from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/transactions/<username>', methods=['GET'])
def get_transactions(username):
    """Get all transactions for a user"""
    filename = f"backend/user_{username}.csv"
    
    if os.path.exists(filename):
        try:
            df = pd.read_csv(filename)
            df = df.fillna('')
            transactions = df.to_dict('records')
            
            return jsonify({
                'success': True,
                'data': transactions
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    else:
        return jsonify({
            'success': True,
            'data': []
        })

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Handle transaction submission"""
    try:
        data = request.json
        
        username = data.get('username', '')
        merchant = data.get('merchant', '')
        amount = data.get('amount', '')
        category = data.get('category', '')
        mood = data.get('mood', 'Neutral')
        location = data.get('location', '')
        calendar_event = data.get('calendar', 'Regular')

        date = datetime.now().strftime("%Y-%m-%d")
        time = datetime.now().strftime("%H:%M:%S")

        filename = f"backend/user_{username}.csv"
        last_balance = 0
        if os.path.exists(filename):
            try:
                existing_df = pd.read_csv(filename)
                if not existing_df.empty and 'Balance_After' in existing_df.columns:
                    last_balance = existing_df['Balance_After'].iloc[-1]
            except:
                last_balance = 0

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

        return jsonify({
            'success': True,
            'message': f'Transaction saved successfully for {username}',
            'data': new_data.to_dict('records')[0]
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400

# For Vercel serverless
def handler(request):
    return app(request)
