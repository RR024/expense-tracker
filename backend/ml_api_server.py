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
    print(f"⚠️ ML Model import failed: {e}")
    ML_AVAILABLE = False

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global analyzer instance cache (one per user)
analyzers = {}

def get_user_csv_path(username):
    """Get the CSV path for a user"""
    return f"user_{username}.csv"

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
        return jsonify({
            'success': False,
            'error': 'ML models not available'
        }), 503
    
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
        return jsonify({
            'success': False,
            'error': 'ML models not available'
        }), 503
    
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
        return jsonify({
            'success': False,
            'error': 'ML models not available'
        }), 503
    
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
        return jsonify({
            'success': False,
            'error': 'ML models not available'
        }), 503
    
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
        return jsonify({
            'success': False,
            'error': 'ML models not available'
        }), 503
    
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
        return jsonify({
            'success': False,
            'error': 'ML models not available'
        }), 503
    
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
    print("🚀 FinSight ML API Server starting...")
    print("📡 Endpoints:")
    print("   GET  /api/ml/health - Health check")
    print("   GET  /api/ml/analyze/<username> - Full analysis")
    print("   GET  /api/ml/predictions/<username> - ML predictions")
    print("   GET  /api/ml/forecasts/<username> - Spending forecasts")
    print("   GET  /api/ml/insights/<username> - Behavioral insights")
    print("   GET  /api/ml/risk-analysis/<username> - Risk analysis")
    print("   POST /api/ml/refresh/<username> - Refresh analysis")
    print("\n🌐 Server running on http://localhost:5000")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
