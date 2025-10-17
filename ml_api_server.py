"""
Flask API Server for FinSight ML Model
Wraps the advanced ML predictions and serves them via REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
import sys
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Import your existing ML analyzer
# Assuming second.py is in the same directory
try:
    from second import FinSightAnalyzer, DataPreprocessor
    ML_AVAILABLE = True
except Exception as e:
    print(f"WARNING: ML Model import failed: {e}")
    ML_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global analyzer instance cache (one per user)
analyzers = {}

def get_user_csv_path(username):
    """Get the CSV path for a user"""
    return f"user_{username}.csv"

def get_mock_analysis(username):
    """Generate mock analysis data when ML is not available"""
    csv_path = get_user_csv_path(username)
    
    if not os.path.exists(csv_path):
        return jsonify({
            'success': False,
            'error': f"No data found for user {username}"
        }), 404
    
    try:
        # Read the CSV to get basic stats
        df = pd.read_csv(csv_path)
        
        # Filter out Initial Balance entries for spending calculations
        spending_df = df[df['Merchant'] != 'Initial Balance'].copy()
        
        total_transactions = len(spending_df)
        total_spending = spending_df['Amount'].sum() if len(spending_df) > 0 else 0
        avg_spending = spending_df['Amount'].mean() if len(spending_df) > 0 else 0
        
        # Get current balance (use Balance_After column, last row)
        balance_col = 'Balance_After' if 'Balance_After' in df.columns else 'Balance'
        current_balance = df[balance_col].iloc[-1] if len(df) > 0 else 50000
        
        # Calculate simple category spending
        categories_data = {}
        if 'Category' in spending_df.columns and 'Amount' in spending_df.columns and len(spending_df) > 0:
            category_spending = spending_df.groupby('Category')['Amount'].agg(['sum', 'count', 'mean']).to_dict('index')
            for cat, stats in category_spending.items():
                categories_data[cat] = {
                    'total': float(stats['sum']),
                    'count': int(stats['count']),
                    'average': float(stats['mean']),
                    'percentage': float(stats['sum'] / total_spending * 100) if total_spending > 0 else 0
                }
        
        # Get initial balance
        initial_balance_row = df[df['Merchant'] == 'Initial Balance']
        initial_balance = initial_balance_row['Amount'].iloc[0] if len(initial_balance_row) > 0 else 50000
        
        mock_data = {
            'success': True,
            'username': username,
            'data': {
                'summary': {
                    'total_transactions': int(total_transactions),
                    'spending': {
                        'total': float(total_spending),
                        'average': float(avg_spending) if total_transactions > 0 else 0,
                        'daily': float(avg_spending) if total_transactions > 0 else 0
                    },
                    'balance': {
                        'current': float(current_balance),
                        'initial': float(initial_balance),
                        'min': float(current_balance * 0.95),
                        'max': float(initial_balance)
                    },
                    'risk_score': 0.025,  # Low default risk
                    'anomalies': {
                        'count': 0,
                        'percentage': 0
                    }
                },
                'categories': categories_data,
                'mood_impact': {
                    'Happy': {'avg_spending': float(avg_spending * 0.85) if total_transactions > 0 else 0, 'count': max(1, int(total_transactions * 0.3))},
                    'Neutral': {'avg_spending': float(avg_spending) if total_transactions > 0 else 0, 'count': max(1, int(total_transactions * 0.5))},
                    'Stressed': {'avg_spending': float(avg_spending * 1.3) if total_transactions > 0 else 0, 'count': max(0, int(total_transactions * 0.2))}
                },
                'time_patterns': {
                    'by_hour': {},
                    'by_day': {},
                    'peak_spending_hour': 14,
                    'peak_spending_day': 'Saturday'
                },
                'locations': {},
                'merchants': {},
                'personas': {
                    'Balanced Spender': max(1, int(total_transactions * 0.6)),
                    'Careful Saver': max(0, int(total_transactions * 0.3)),
                    'Impulse Buyer': max(0, int(total_transactions * 0.1))
                },
                'recommendations': [
                    {
                        'type': 'savings' if total_spending < initial_balance * 0.1 else 'budget',
                        'title': 'Great spending habits!' if total_spending < initial_balance * 0.1 else 'Monitor your spending',
                        'description': f'You have spent Rs.{total_spending:.2f} so far. {"Keep up the good work!" if total_spending < initial_balance * 0.1 else "Consider tracking categories to optimize expenses."}',
                        'priority': 'medium',
                        'potential_savings': float(total_spending * 0.1) if total_spending > 0 else 0
                    }
                ],
                'behavioral_insights': [
                    {
                        'category': 'spending_pattern',
                        'insight': f'You have made {total_transactions} transaction{"s" if total_transactions != 1 else ""} with an average of Rs.{avg_spending:.2f}',
                        'recommendation': 'Continue tracking to build better insights' if total_transactions < 10 else 'Good transaction history for analysis'
                    },
                    {
                        'category': 'financial_health',
                        'insight': f'Current balance: Rs.{current_balance:.2f} ({"Healthy" if current_balance > initial_balance * 0.8 else "Monitor closely"})',
                        'recommendation': 'Maintain your current spending rate' if current_balance > initial_balance * 0.8 else 'Consider reducing discretionary spending'
                    }
                ],
                'anomalies': [],
                'forecasts': {}
            },
            'timestamp': datetime.now().isoformat(),
            'ml_mode': 'fallback'
        }
        
        return jsonify(mock_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Error generating mock data: {str(e)}"
        }), 500

def get_mock_forecasts(username):
    """Generate mock forecast data"""
    csv_path = get_user_csv_path(username)
    
    if not os.path.exists(csv_path):
        return jsonify({
            'success': False,
            'error': f"No data found for user {username}"
        }), 404
    
    try:
        df = pd.read_csv(csv_path)
        
        # Filter out Initial Balance for spending calculations
        spending_df = df[df['Merchant'] != 'Initial Balance'].copy()
        
        # Calculate average spending per transaction
        avg_spending = spending_df['Amount'].mean() if len(spending_df) > 0 else 0
        
        # Get current balance
        balance_col = 'Balance_After' if 'Balance_After' in df.columns else 'Balance'
        current_balance = df[balance_col].iloc[-1] if len(df) > 0 else 50000
        
        # Calculate days remaining in month
        today = datetime.now()
        days_in_month = 31  # October has 31 days
        current_day = today.day
        days_remaining = days_in_month - current_day
        
        # Estimate daily transactions (if we have data)
        if len(spending_df) > 0:
            # Calculate how many days of data we have
            days_of_data = current_day  # Assume all transactions are from this month
            daily_transaction_count = len(spending_df) / max(days_of_data, 1)
            
            # Project future transactions
            projected_transaction_count = int(daily_transaction_count * days_remaining)
            projected_expenses = avg_spending * projected_transaction_count
        else:
            projected_expenses = 0
            
        projected_balance = current_balance - projected_expenses
        
        # Calculate confidence based on amount of data
        confidence = min(0.95, 0.5 + (len(spending_df) * 0.05))  # Higher confidence with more data
        
        return jsonify({
            'success': True,
            'data': {
                'projected_expenses': float(projected_expenses),
                'daily_average': float(avg_spending),
                'projected_balance': float(projected_balance),
                'min_balance': float(projected_balance * 0.85),  # Conservative estimate
                'days_remaining': days_remaining,
                'confidence': confidence,
                'transactions_count': len(spending_df),
                'current_balance': float(current_balance)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def get_mock_insights(username):
    """Generate mock insights data"""
    csv_path = get_user_csv_path(username)
    
    if not os.path.exists(csv_path):
        return jsonify({
            'success': False,
            'error': f"No data found for user {username}"
        }), 404
    
    return jsonify({
        'success': True,
        'data': {
            'behavioral_insights': [
                {
                    'category': 'spending_pattern',
                    'insight': 'Your spending patterns are being analyzed',
                    'recommendation': 'Continue tracking expenses for better insights'
                }
            ],
            'recommendations': [
                {
                    'type': 'general',
                    'title': 'Keep tracking',
                    'description': 'Monitor your expenses regularly for better financial health',
                    'priority': 'medium'
                }
            ],
            'financial_stability_score': 75.0
        }
    })

def get_mock_risk_analysis(username):
    """Generate mock risk analysis data"""
    return jsonify({
        'success': True,
        'data': {
            'average_risk': 0.045,
            'recent_risk': 0.042,
            'high_risk_count': 0,
            'high_risk_percentage': 0.0,
            'risk_trend': 'stable',
            'risk_by_category': {}
        }
    })

def get_or_create_analyzer(username):
    """Get or create an analyzer for a user"""
    csv_path = get_user_csv_path(username)
    
    if not os.path.exists(csv_path):
        return None, f"No data found for user {username}"
    
    # Check if analyzer exists and is fresh
    if username in analyzers:
        # Check if CSV was modified since last analysis
        csv_mtime = os.path.getmtime(csv_path)
        if analyzers[username]['mtime'] >= csv_mtime:
            return analyzers[username]['analyzer'], None
    
    # Create new analyzer
    try:
        analyzer = FinSightAnalyzer(csv_path)
        analyzer.load_and_process()
        
        analyzers[username] = {
            'analyzer': analyzer,
            'mtime': os.path.getmtime(csv_path),
            'updated_at': datetime.now()
        }
        
        return analyzer, None
    except Exception as e:
        return None, str(e)

@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'ml_available': ML_AVAILABLE,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/ml/analyze/<username>', methods=['GET'])
def get_full_analysis(username):
    """Get complete ML analysis for a user"""
    if not ML_AVAILABLE:
        # Return mock/fallback data when ML libraries aren't installed
        return get_mock_analysis(username)
    
    analyzer, error = get_or_create_analyzer(username)
    
    if error:
        return jsonify({
            'success': False,
            'error': error
        }), 404
    
    try:
        # Generate all analyses
        summary = analyzer.generate_summary_stats()
        categories = analyzer.analyze_categories()
        mood_impact = analyzer.analyze_mood_impact()
        time_patterns = analyzer.analyze_time_patterns()
        locations = analyzer.analyze_locations()
        merchants = analyzer.analyze_merchants()
        personas = analyzer.analyze_personas()
        recommendations = analyzer.get_enhanced_recommendations()
        
        # Get behavioral insights
        behavioral_insights = analyzer.behavioral_analyzer.generate_all_insights(
            analyzer.df_processed
        )
        
        # Get anomalies
        anomaly_indices = analyzer.df_processed['Is_Anomaly']
        anomaly_details = analyzer.anomaly_detector.get_anomaly_details(
            analyzer.df_processed, 
            anomaly_indices
        )
        
        return jsonify({
            'success': True,
            'username': username,
            'data': {
                'summary': summary,
                'categories': categories,
                'mood_impact': mood_impact,
                'time_patterns': time_patterns,
                'locations': locations,
                'merchants': merchants,
                'personas': personas,
                'recommendations': recommendations[:10],  # Top 10
                'behavioral_insights': behavioral_insights[:10],
                'anomalies': anomaly_details,
                'forecasts': analyzer.forecasts if hasattr(analyzer, 'forecasts') else {}
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/predictions/<username>', methods=['GET'])
def get_predictions(username):
    """Get ML predictions for user's transactions"""
    if not ML_AVAILABLE:
        # Return empty predictions with success
        return jsonify({
            'success': True,
            'data': [],
            'total': 0,
            'ml_mode': 'fallback'
        })
    
    analyzer, error = get_or_create_analyzer(username)
    
    if error:
        return jsonify({
            'success': False,
            'error': error
        }), 404
    
    try:
        df = analyzer.df_processed
        
        # Get predictions for all transactions
        predictions = []
        for idx, row in df.iterrows():
            predictions.append({
                'transaction_id': int(idx),
                'merchant': row['Merchant'],
                'amount': float(row['Amount']),
                'category': row['Category'],
                'predicted_risk': float(row['Predicted_Risk']),
                'is_anomaly': bool(row['Is_Anomaly'] == -1),
                'persona': row['Persona'],
                'date': row['DateTime'].strftime('%Y-%m-%d'),
                'mood': row['Mood'],
                'location': row['Location']
            })
        
        return jsonify({
            'success': True,
            'data': predictions,
            'total': len(predictions)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/forecasts/<username>', methods=['GET'])
def get_forecasts(username):
    """Get spending forecasts"""
    if not ML_AVAILABLE:
        return get_mock_forecasts(username)
    
    analyzer, error = get_or_create_analyzer(username)
    
    if error:
        return jsonify({
            'success': False,
            'error': error
        }), 404
    
    try:
        forecasts = analyzer.forecasts if hasattr(analyzer, 'forecasts') else {}
        
        return jsonify({
            'success': True,
            'data': forecasts
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/insights/<username>', methods=['GET'])
def get_insights(username):
    """Get behavioral insights and recommendations"""
    if not ML_AVAILABLE:
        return get_mock_insights(username)
    
    analyzer, error = get_or_create_analyzer(username)
    
    if error:
        return jsonify({
            'success': False,
            'error': error
        }), 404
    
    try:
        # Get all insights
        behavioral_insights = analyzer.behavioral_analyzer.generate_all_insights(
            analyzer.df_processed
        )
        
        recommendations = analyzer.get_enhanced_recommendations()
        
        # Calculate financial stability score
        stability_score = analyzer.behavioral_analyzer.calculate_financial_stability_score(
            analyzer.df_processed
        )
        
        return jsonify({
            'success': True,
            'data': {
                'behavioral_insights': behavioral_insights,
                'recommendations': recommendations,
                'financial_stability_score': stability_score
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/risk-analysis/<username>', methods=['GET'])
def get_risk_analysis(username):
    """Get risk analysis"""
    if not ML_AVAILABLE:
        return get_mock_risk_analysis(username)
    
    analyzer, error = get_or_create_analyzer(username)
    
    if error:
        return jsonify({
            'success': False,
            'error': error
        }), 404
    
    try:
        df = analyzer.df_processed
        
        # Calculate risk metrics
        avg_risk = float(df['Risk_Score'].mean())
        high_risk_count = int((df['Risk_Score'] > 0.7).sum())
        high_risk_percentage = float(high_risk_count / len(df) * 100)
        
        # Recent risk trend (last 10 transactions)
        recent_risk = float(df['Risk_Score'].tail(10).mean())
        risk_trend = 'increasing' if recent_risk > avg_risk else 'decreasing'
        
        # Risk by category
        risk_by_category = df.groupby('Category')['Risk_Score'].mean().to_dict()
        
        return jsonify({
            'success': True,
            'data': {
                'average_risk': avg_risk,
                'recent_risk': recent_risk,
                'high_risk_count': high_risk_count,
                'high_risk_percentage': high_risk_percentage,
                'risk_trend': risk_trend,
                'risk_by_category': risk_by_category
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/refresh/<username>', methods=['POST'])
def refresh_analysis(username):
    """Force refresh analysis for a user"""
    if not ML_AVAILABLE:
        # For fallback mode, just return success
        return jsonify({
            'success': True,
            'message': f'Analysis refreshed for {username} (fallback mode)',
            'timestamp': datetime.now().isoformat(),
            'ml_mode': 'fallback'
        })
    
    # Remove cached analyzer
    if username in analyzers:
        del analyzers[username]
    
    # Create new analyzer
    analyzer, error = get_or_create_analyzer(username)
    
    if error:
        return jsonify({
            'success': False,
            'error': error
        }), 404
    
    return jsonify({
        'success': True,
        'message': f'Analysis refreshed for {username}',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("=> FinSight ML API Server starting...")
    print("=> Endpoints:")
    print("   GET  /api/ml/health - Health check")
    print("   GET  /api/ml/analyze/<username> - Full analysis")
    print("   GET  /api/ml/predictions/<username> - ML predictions")
    print("   GET  /api/ml/forecasts/<username> - Spending forecasts")
    print("   GET  /api/ml/insights/<username> - Behavioral insights")
    print("   GET  /api/ml/risk-analysis/<username> - Risk analysis")
    print("   POST /api/ml/refresh/<username> - Refresh analysis")
    print("\n=> Server running on http://localhost:5000")
    
    app.run(debug=False, port=5000, host='0.0.0.0')
