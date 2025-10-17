"""
FinSight Enhanced - Advanced Financial Intelligence Dashboard
Includes forecasting, behavioral analysis, and predictive insights
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# Core ML Libraries
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except Exception as _e:
    XGB_AVAILABLE = False
    print("⚠️ XGBoost not available, will fallback to RandomForest for risk prediction")

# Time Series
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except Exception as _e:
    PROPHET_AVAILABLE = False
    print("⚠️ Prophet not available, forecasting will use LSTM only (if available)")
try:
    from statsmodels.tsa.arima.model import ARIMA
    ARIMA_AVAILABLE = True
except:
    ARIMA_AVAILABLE = False
    print("⚠️ ARIMA not available, using Prophet only")

# Deep Learning
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.callbacks import EarlyStopping
    TENSORFLOW_AVAILABLE = True
except Exception as _e:
    TENSORFLOW_AVAILABLE = False
    # Do not print noisy errors here; we'll warn when feature is used

import pickle
import os
import json
from collections import defaultdict
import calendar

# Configuration
CSV_FILE_PATH = "fin_data.csv"

# ============================================================================
# DATA PREPROCESSING MODULE
# ============================================================================

class DataPreprocessor:
    """Handles all data preprocessing, feature engineering, and encoding"""
    
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        self.feature_cols = []
        
    def load_data(self, filepath: str) -> pd.DataFrame:
        """Load data from CSV file"""
        try:
            print(f"📁 Loading data from: {filepath}")
            df = pd.read_csv(filepath)
            print(f"✅ Successfully loaded {len(df)} transactions")
            print(f"📊 Columns: {list(df.columns)}")
            
            required_cols = ['Date', 'Time', 'Merchant', 'Amount', 'Category', 
                           'Mood', 'Location', 'Calendar_Event', 'Group_ID', 
                           'Balance_After']
            
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                raise ValueError(f"Missing required columns: {missing_cols}")
            
            print("🧹 Cleaning and validating data...")
            
            # Clean numeric columns
            for col in ['Amount', 'Balance_After', 'Group_ID']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                    invalid_count = df[col].isna().sum()
                    if invalid_count > 0:
                        print(f"⚠️ Found {invalid_count} invalid {col} values")
                        if col == 'Balance_After':
                            df[col] = df[col].fillna(method='ffill').fillna(0)
                        else:
                            df[col] = df[col].fillna(0 if col == 'Amount' else 1)
            
            initial_len = len(df)
            df = df.dropna(subset=['Amount', 'Balance_After'])
            final_len = len(df)
            
            if initial_len != final_len:
                print(f"⚠️ Removed {initial_len - final_len} rows with invalid critical data")
            
            if len(df) == 0:
                raise ValueError("No valid data remaining after cleaning")
            
            print(f"✅ Data cleaned successfully. Final dataset: {len(df)} transactions")
            return df
            
        except FileNotFoundError:
            raise FileNotFoundError(f"CSV file not found: {filepath}")
        except Exception as e:
            raise Exception(f"Error reading CSV file: {str(e)}")
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract temporal, behavioral, and contextual features"""
        df = df.copy()
        
        # Ensure numeric columns
        numeric_cols = ['Amount', 'Balance_After', 'Group_ID']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Parse datetime
        try:
            df['DateTime'] = pd.to_datetime(df['Date'].astype(str) + ' ' + df['Time'].astype(str))
        except:
            df['DateTime'] = pd.to_datetime(df['Date'], errors='coerce')
            df['DateTime'] = df['DateTime'].fillna(pd.Timestamp.now())
        
        # Temporal Features
        df['Year'] = df['DateTime'].dt.year
        df['Month'] = df['DateTime'].dt.month
        df['Day'] = df['DateTime'].dt.day
        df['DayOfWeek'] = df['DateTime'].dt.dayofweek
        df['Hour'] = df['DateTime'].dt.hour
        df['IsWeekend'] = (df['DayOfWeek'] >= 5).astype(int)
        df['IsNight'] = ((df['Hour'] >= 22) | (df['Hour'] <= 6)).astype(int)
        
        # Cyclical encoding
        df['Month_sin'] = np.sin(2 * np.pi * df['Month'] / 12)
        df['Month_cos'] = np.cos(2 * np.pi * df['Month'] / 12)
        df['Hour_sin'] = np.sin(2 * np.pi * df['Hour'] / 24)
        df['Hour_cos'] = np.cos(2 * np.pi * df['Hour'] / 24)
        df['DayOfWeek_sin'] = np.sin(2 * np.pi * df['DayOfWeek'] / 7)
        df['DayOfWeek_cos'] = np.cos(2 * np.pi * df['DayOfWeek'] / 7)
        
        # Financial Features
        df['Amount_Log'] = np.log1p(df['Amount'].clip(lower=0))
        df['Balance_After_Log'] = np.log1p(df['Balance_After'].clip(lower=0))
        
        # Rolling statistics
        df = df.sort_values('DateTime').reset_index(drop=True)
        df['Amount_Rolling_Mean_7'] = df['Amount'].rolling(window=7, min_periods=1).mean()
        df['Amount_Rolling_Std_7'] = df['Amount'].rolling(window=7, min_periods=1).std().fillna(0)
        df['Amount_Rolling_Mean_30'] = df['Amount'].rolling(window=30, min_periods=1).mean()
        
        # Behavioral Features
        denominator = df['Balance_After'] + df['Amount']
        denominator = denominator.replace(0, 1)
        df['Spend_Rate'] = (df['Amount'] / denominator).fillna(0).clip(0, 1)
        df['Balance_Change'] = df['Balance_After'].diff().fillna(0)
        
        # Create Risk_Score if not present
        if 'Risk_Score' not in df.columns:
            balance_max = df['Balance_After'].max() if df['Balance_After'].max() > 0 else 1
            amount_max = df['Amount'].max() if df['Amount'].max() > 0 else 1
            
            df['Risk_Score'] = np.clip(
                df['Spend_Rate'] * 0.5 + 
                (1 - df['Balance_After'] / balance_max) * 0.3 +
                (df['Amount'] / amount_max) * 0.2,
                0, 1
            )
        
        # Context Features
        df['High_Risk_Context'] = (
            (df['Mood'].astype(str) == 'Stressed') | 
            (df['Calendar_Event'].astype(str) == 'Holiday') |
            (df['IsWeekend'] == 1)
        ).astype(int)
        
        return df
    
    def encode_categorical(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """Encode categorical variables"""
        df = df.copy()
        categorical_cols = ['Category', 'Mood', 'Location', 'Calendar_Event', 'Merchant']
        
        for col in categorical_cols:
            if col in df.columns:
                if fit:
                    le = LabelEncoder()
                    df[f'{col}_Encoded'] = le.fit_transform(df[col].astype(str))
                    self.encoders[col] = le
                else:
                    if col in self.encoders:
                        df[f'{col}_Encoded'] = self.encoders[col].transform(df[col].astype(str))
        
        return df
    
    def scale_features(self, df: pd.DataFrame, feature_cols: List[str], fit: bool = True) -> pd.DataFrame:
        """Scale numerical features"""
        df = df.copy()
        
        if fit:
            scaler = StandardScaler()
            df[feature_cols] = scaler.fit_transform(df[feature_cols])
            self.scalers['features'] = scaler
        else:
            if 'features' in self.scalers:
                df[feature_cols] = self.scalers['features'].transform(df[feature_cols])
        
        return df
    
    def prepare_dataset(self, df: pd.DataFrame, target_col: str = 'Risk_Score') -> Tuple[pd.DataFrame, pd.Series]:
        """Complete preprocessing pipeline"""
        df = self.engineer_features(df)
        df = self.encode_categorical(df, fit=True)
        
        feature_cols = [
            'Amount', 'Amount_Log', 'Hour', 'DayOfWeek', 'IsWeekend', 'IsNight',
            'Month_sin', 'Month_cos', 'Hour_sin', 'Hour_cos', 'DayOfWeek_sin', 'DayOfWeek_cos',
            'Amount_Rolling_Mean_7', 'Amount_Rolling_Std_7', 'Amount_Rolling_Mean_30',
            'Spend_Rate', 'Balance_After', 'Balance_After_Log', 'Balance_Change',
            'High_Risk_Context', 'Category_Encoded', 'Mood_Encoded', 
            'Location_Encoded', 'Calendar_Event_Encoded', 'Group_ID'
        ]
        
        feature_cols = [col for col in feature_cols if col in df.columns]
        self.feature_cols = feature_cols
        
        X = df[feature_cols].fillna(0)
        y = df[target_col] if target_col in df.columns else None
        
        X = self.scale_features(X, feature_cols, fit=True)
        
        return X, y


# ============================================================================
# ADVANCED PREDICTION MODELS
# ============================================================================

class FinancialForecaster:
    """Predicts financial trajectory for next 30 days"""
    
    def __init__(self):
        self.prophet_model = None
        self.lstm_model = None
        self.scaler = StandardScaler()
        self._last_computed_horizon = None

    def _remaining_days_in_month_from(self, ref_date: datetime) -> int:
        if isinstance(ref_date, pd.Timestamp):
            d = ref_date.to_pydatetime().date()
        elif isinstance(ref_date, datetime):
            d = ref_date.date()
        else:
            d = pd.to_datetime(ref_date).date()
        last_day = calendar.monthrange(d.year, d.month)[1]
        remaining = last_day - d.day
        return max(1, remaining)  # at least 1 day to show a minimal projection

    def _compute_horizon(self, df: pd.DataFrame) -> int:
        # Use the last date present in the dataset as reference
        last_dt = pd.to_datetime(df['DateTime']).max()
        horizon = self._remaining_days_in_month_from(last_dt)
        self._last_computed_horizon = horizon
        return horizon
        
    def prepare_time_series(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare time series data"""
        df = df.copy()
        df['Date'] = pd.to_datetime(df['DateTime']).dt.date
        daily_data = df.groupby('Date').agg({
            'Amount': 'sum',
            'Balance_After': 'last',
            'Risk_Score': 'mean'
        }).reset_index()
        daily_data['Date'] = pd.to_datetime(daily_data['Date'])
        return daily_data
    
    def forecast_with_prophet(self, df: pd.DataFrame) -> Dict:
        """Forecast using Facebook Prophet"""
        if not PROPHET_AVAILABLE:
            print("⚠️ Prophet not installed. Skipping Prophet forecast.")
            return None
        try:
            daily_data = self.prepare_time_series(df)
            horizon = self._compute_horizon(df)
            
            prophet_df = pd.DataFrame({
                'ds': daily_data['Date'],
                'y': daily_data['Amount']
            })
            
            self.prophet_model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=False,
                changepoint_prior_scale=0.05
            )
            self.prophet_model.fit(prophet_df)
            
            future = self.prophet_model.make_future_dataframe(periods=horizon)
            forecast = self.prophet_model.predict(future)
            
            forecast_values = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(horizon)
            
            return {
                'dates': forecast_values['ds'].dt.strftime('%Y-%m-%d').tolist(),
                'predicted': forecast_values['yhat'].clip(lower=0).tolist(),
                'lower_bound': forecast_values['yhat_lower'].clip(lower=0).tolist(),
                'upper_bound': forecast_values['yhat_upper'].clip(lower=0).tolist(),
                'total_forecast': float(forecast_values['yhat'].clip(lower=0).sum()),
                'avg_daily': float(forecast_values['yhat'].clip(lower=0).mean()),
                'horizon_days': int(horizon)
            }
        except Exception as e:
            print(f"⚠️ Prophet forecasting failed: {e}")
            return None
    
    def forecast_with_lstm(self, df: pd.DataFrame) -> Dict:
        """Forecast using LSTM"""
        if not TENSORFLOW_AVAILABLE:
            print("⚠️ TensorFlow not installed. Skipping LSTM forecast.")
            return None
        try:
            daily_data = self.prepare_time_series(df)
            
            if len(daily_data) < 60:
                print("⚠️ Insufficient data for LSTM (need 60+ days)")
                return None
            
            sequence_length = 14
            amounts = daily_data['Amount'].values
            
            amounts_scaled = self.scaler.fit_transform(amounts.reshape(-1, 1))
            
            X, y = [], []
            for i in range(len(amounts_scaled) - sequence_length):
                X.append(amounts_scaled[i:i+sequence_length])
                y.append(amounts_scaled[i+sequence_length])
            
            X = np.array(X)
            y = np.array(y)
            
            self.lstm_model = Sequential([
                LSTM(50, activation='relu', return_sequences=True, input_shape=(sequence_length, 1)),
                Dropout(0.2),
                LSTM(50, activation='relu'),
                Dropout(0.2),
                Dense(25, activation='relu'),
                Dense(1)
            ])
            
            self.lstm_model.compile(optimizer='adam', loss='mse')
            
            early_stop = EarlyStopping(monitor='loss', patience=5, restore_best_weights=True)
            self.lstm_model.fit(X, y, epochs=50, batch_size=16, verbose=0, callbacks=[early_stop])
            
            last_sequence = amounts_scaled[-sequence_length:]
            predictions = []
            horizon = self._compute_horizon(df)
            
            for _ in range(horizon):
                pred = self.lstm_model.predict(last_sequence.reshape(1, sequence_length, 1), verbose=0)
                predictions.append(pred[0, 0])
                last_sequence = np.append(last_sequence[1:], pred)
            
            predictions = self.scaler.inverse_transform(np.array(predictions).reshape(-1, 1)).flatten()
            predictions = np.clip(predictions, 0, None)
            
            last_date = daily_data['Date'].max()
            forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=horizon)
            
            return {
                'dates': forecast_dates.strftime('%Y-%m-%d').tolist(),
                'predicted': predictions.tolist(),
                'total_forecast': float(predictions.sum()),
                'avg_daily': float(predictions.mean()),
                'horizon_days': int(horizon)
            }
        except Exception as e:
            print(f"⚠️ LSTM forecasting failed: {e}")
            return None
    
    def forecast_balance(self, df: pd.DataFrame, expense_forecast: Dict) -> Dict:
        """Forecast account balance"""
        try:
            current_balance = df['Balance_After'].iloc[-1]
            
            daily_income = 0
            positive_changes = df[df['Balance_Change'] > df['Amount']]['Balance_Change']
            if len(positive_changes) > 0:
                daily_income = positive_changes.sum() / len(df['DateTime'].dt.date.unique())
            
            forecasted_expenses = expense_forecast['predicted']
            balance_projection = [current_balance]
            
            for daily_expense in forecasted_expenses:
                new_balance = balance_projection[-1] + daily_income - daily_expense
                balance_projection.append(new_balance)
            
            balance_projection = balance_projection[1:]
            
            return {
                'dates': expense_forecast['dates'],
                'projected_balance': balance_projection,
                'end_balance': float(balance_projection[-1]),
                'min_balance': float(min(balance_projection)),
                'risk_of_negative': sum(1 for b in balance_projection if b < 0) / len(balance_projection)
            }
        except Exception as e:
            print(f"⚠️ Balance forecasting failed: {e}")
            return None
    
    def forecast_category_spending(self, df: pd.DataFrame) -> Dict:
        """Forecast spending by category"""
        try:
            df['Date'] = pd.to_datetime(df['DateTime']).dt.date
            category_daily = df.groupby(['Date', 'Category'])['Amount'].sum().reset_index()
            horizon = self._compute_horizon(df)
            
            forecasts = {}
            for category in df['Category'].unique():
                cat_data = category_daily[category_daily['Category'] == category]
                
                if len(cat_data) < 14:
                    continue
                
                prophet_df = pd.DataFrame({
                    'ds': pd.to_datetime(cat_data['Date']),
                    'y': cat_data['Amount']
                })
                
                if not PROPHET_AVAILABLE:
                    continue
                model = Prophet(daily_seasonality=False, weekly_seasonality=True, 
                               yearly_seasonality=False, changepoint_prior_scale=0.01)
                model.fit(prophet_df)
                
                future = model.make_future_dataframe(periods=horizon)
                forecast = model.predict(future)
                
                predicted = forecast['yhat'].tail(horizon).clip(lower=0)
                forecasts[category] = {
                    'total': float(predicted.sum()),
                    'daily_avg': float(predicted.mean())
                }
            
            return forecasts
        except Exception as e:
            print(f"⚠️ Category forecasting failed: {e}")
            return {}


class BehavioralAnalyzer:
    """Analyzes spending behavior patterns"""
    
    def __init__(self):
        self.insights = []
        
    def analyze_mood_impact(self, df: pd.DataFrame) -> List[str]:
        """Analyze mood impact on spending"""
        insights = []
        
        mood_spending = df.groupby('Mood')['Amount'].agg(['mean', 'sum', 'count'])
        
        if len(mood_spending) > 1:
            max_mood = mood_spending['mean'].idxmax()
            min_mood = mood_spending['mean'].idxmin()
            max_avg = mood_spending.loc[max_mood, 'mean']
            min_avg = mood_spending.loc[min_mood, 'mean']
            
            if max_avg > min_avg * 1.3:
                diff_pct = ((max_avg - min_avg) / min_avg) * 100
                insights.append(
                    f"🧠 Mood Impact: You spend {diff_pct:.0f}% more when feeling '{max_mood}' "
                    f"compared to '{min_mood}' — possible emotional spending pattern."
                )
        
        if 'Stressed' in mood_spending.index:
            stressed_avg = mood_spending.loc['Stressed', 'mean']
            overall_avg = df['Amount'].mean()
            if stressed_avg > overall_avg * 1.2:
                insights.append(
                    f"⚠️ Stress Spending: Average transaction when stressed (₹{stressed_avg:.2f}) "
                    f"is {((stressed_avg/overall_avg - 1) * 100):.0f}% higher than normal."
                )
        
        return insights
    
    def analyze_temporal_patterns(self, df: pd.DataFrame) -> List[str]:
        """Analyze time-based patterns"""
        insights = []
        
        weekend_avg = df[df['IsWeekend'] == 1]['Amount'].mean()
        weekday_avg = df[df['IsWeekend'] == 0]['Amount'].mean()
        
        if weekend_avg > weekday_avg * 1.25:
            diff_pct = ((weekend_avg - weekday_avg) / weekday_avg) * 100
            insights.append(
                f"🎯 Weekend Pattern: Weekend spending (₹{weekend_avg:.2f}) is {diff_pct:.0f}% "
                f"higher than weekdays — likely leisure-driven."
            )
        
        # Hourly patterns
        hourly_spending = df.groupby('Hour')['Amount'].agg(['sum', 'count'])
        peak_hours = hourly_spending['sum'].nlargest(3).index.tolist()
        
        if any(h >= 20 for h in peak_hours):
            insights.append(
                f"🕐 Night Spending: Most impulse purchases occur between 8 PM–11 PM. "
                f"Consider delaying non-essential purchases to next day."
            )
        
        return insights
    
    def analyze_location_patterns(self, df: pd.DataFrame) -> List[str]:
        """Analyze location spending"""
        insights = []
        
        location_spending = df.groupby('Location')['Amount'].agg(['sum', 'mean', 'count'])
        
        if len(location_spending) > 1:
            top_location = location_spending['sum'].idxmax()
            top_pct = (location_spending.loc[top_location, 'sum'] / df['Amount'].sum()) * 100
            
            if top_pct > 40:
                insights.append(
                    f"📍 Location Concentration: {top_pct:.0f}% of spending occurs at '{top_location}'. "
                    f"Consider local alternatives to diversify."
                )
        
        return insights
    
    def analyze_group_spending(self, df: pd.DataFrame) -> List[str]:
        """Analyze group expense patterns"""
        insights = []
        
        if df['Group_ID'].nunique() > 1:
            group_spending = df.groupby('Group_ID')['Amount'].agg(['sum', 'mean', 'count'])
            avg_group_spend = group_spending['mean'].mean()
            max_group = group_spending['mean'].idxmax()
            max_spend = group_spending.loc[max_group, 'mean']
            
            if max_spend > avg_group_spend * 1.3:
                insights.append(
                    f"🧍‍♂️ Group Expenses: Your contribution in group {max_group} "
                    f"(₹{max_spend:.2f}) exceeds average — track shared expenses transparently."
                )
        
        return insights
    
    def analyze_calendar_events(self, df: pd.DataFrame) -> List[str]:
        """Analyze calendar event impact"""
        insights = []
        
        event_spending = df[df['Calendar_Event'] != 'None'].groupby('Calendar_Event')['Amount'].agg(['sum', 'mean', 'count'])
        
        if len(event_spending) > 0:
            total_event_spend = event_spending['sum'].sum()
            total_spend = df['Amount'].sum()
            event_pct = (total_event_spend / total_spend) * 100
            
            if event_pct > 25:
                insights.append(
                    f"🔔 Calendar Events: {event_pct:.0f}% of spending linked to events "
                    f"(holidays, birthdays). Pre-plan budgets for recurring events."
                )
        
        return insights
    
    def analyze_merchant_loyalty(self, df: pd.DataFrame) -> List[str]:
        """Analyze merchant spending patterns"""
        insights = []
        
        merchant_counts = df['Merchant'].value_counts()
        unique_merchants = len(merchant_counts)
        total_transactions = len(df)
        
        avg_visits_per_merchant = total_transactions / unique_merchants
        
        if avg_visits_per_merchant < 2:
            new_merchant_pct = (merchant_counts == 1).sum() / unique_merchants * 100
            insights.append(
                f"🏪 Merchant Variety: {new_merchant_pct:.0f}% are one-time merchants. "
                f"High variety may indicate exploratory spending."
            )
        
        return insights
    
    def calculate_financial_stability_score(self, df: pd.DataFrame) -> float:
        """Calculate overall financial stability score"""
        scores = []
        
        # Balance stability
        balance_cv = df['Balance_After'].std() / df['Balance_After'].mean() if df['Balance_After'].mean() > 0 else 1
        balance_score = max(0, 1 - balance_cv)
        scores.append(balance_score * 25)
        
        # Spending consistency
        amount_cv = df['Amount'].std() / df['Amount'].mean() if df['Amount'].mean() > 0 else 1
        spending_score = max(0, 1 - amount_cv / 2)
        scores.append(spending_score * 25)
        
        # Risk management
        avg_risk = df['Risk_Score'].mean()
        risk_score = max(0, 1 - avg_risk)
        scores.append(risk_score * 25)
        
        # Savings rate
        total_income = df[df['Balance_Change'] > df['Amount']]['Balance_Change'].sum()
        total_expenses = df['Amount'].sum()
        savings_rate = (total_income - total_expenses) / total_income if total_income > 0 else 0
        scores.append(max(0, savings_rate * 100) * 0.25)
        
        return sum(scores)
    
    def generate_all_insights(self, df: pd.DataFrame) -> List[str]:
        """Generate comprehensive behavioral insights"""
        all_insights = []
        
        all_insights.extend(self.analyze_mood_impact(df))
        all_insights.extend(self.analyze_temporal_patterns(df))
        all_insights.extend(self.analyze_location_patterns(df))
        all_insights.extend(self.analyze_group_spending(df))
        all_insights.extend(self.analyze_calendar_events(df))
        all_insights.extend(self.analyze_merchant_loyalty(df))
        
        # Add stability score
        stability_score = self.calculate_financial_stability_score(df)
        all_insights.append(
            f"💼 Financial Stability Score: {stability_score:.0f}/100 — "
            f"{'Excellent' if stability_score >= 80 else 'Good' if stability_score >= 60 else 'Needs Improvement'}"
        )
        
        return all_insights


# ============================================================================
# EXISTING ML MODELS (Enhanced)
# ============================================================================

class RiskPredictor:
    """Predicts financial risk using ML"""
    
    def __init__(self):
        self.model = None
        
    def train(self, X: pd.DataFrame, y: pd.Series):
        """Train risk prediction model"""
        if len(X) < 50:
            print("⚠️  Insufficient data for training risk model")
            return self
            
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        if XGB_AVAILABLE:
            self.model = xgb.XGBRegressor(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.9,
                colsample_bytree=0.9,
                random_state=42
            )
        else:
            print("ℹ️ Using RandomForestRegressor fallback for risk prediction")
            self.model = RandomForestRegressor(
                n_estimators=300,
                max_depth=None,
                random_state=42,
                n_jobs=-1
            )
        
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"✅ Risk Model - MSE: {mse:.4f}, R²: {r2:.4f}")
        
        return self
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predict risk scores"""
        if self.model is None:
            return np.zeros(len(X))
        return self.model.predict(X)


class AnomalyDetector:
    """Detects anomalous transactions"""
    
    def __init__(self):
        self.model = None
        
    def train(self, X: pd.DataFrame):
        """Train anomaly detection model"""
        if len(X) < 50:
            print("⚠️  Insufficient data for training anomaly detector")
            return self
            
        self.model = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        self.model.fit(X)
        print("✅ Anomaly Detector trained")
        return self
    
    def detect(self, X: pd.DataFrame) -> np.ndarray:
        """Detect anomalies"""
        if self.model is None:
            return np.ones(len(X))
        return self.model.predict(X)
    
    def get_anomaly_details(self, df: pd.DataFrame, anomaly_indices: np.ndarray) -> List[Dict]:
        """Get details of anomalous transactions"""
        anomalies = df[anomaly_indices == -1].copy()
        
        details = []
        for idx, row in anomalies.iterrows():
            details.append({
                'date': row['DateTime'].strftime('%Y-%m-%d %H:%M'),
                'merchant': row['Merchant'],
                'amount': float(row['Amount']),
                'category': row['Category'],
                'reason': self._determine_anomaly_reason(row, df)
            })
        
        return details[:10]  # Top 10 anomalies
    
    def _determine_anomaly_reason(self, transaction: pd.Series, df: pd.DataFrame) -> str:
        """Determine why transaction is anomalous"""
        reasons = []
        
        avg_amount = df['Amount'].mean()
        std_amount = df['Amount'].std()
        
        if transaction['Amount'] > avg_amount + 2 * std_amount:
            reasons.append(f"Unusually high amount (₹{transaction['Amount']:.2f})")
        
        if transaction['Hour'] < 6 or transaction['Hour'] > 22:
            reasons.append(f"Unusual time ({transaction['Hour']}:00)")
        
        cat_avg = df[df['Category'] == transaction['Category']]['Amount'].mean()
        if transaction['Amount'] > cat_avg * 2:
            reasons.append(f"High for {transaction['Category']} category")
        
        return "; ".join(reasons) if reasons else "Statistical outlier"


class PersonaClassifier:
    """Classifies users into spending personas"""
    
    def __init__(self):
        self.model = None
        self.persona_labels = {
            0: 'Stable Spender',
            1: 'Impulsive Spender',
            2: 'Goal-Driven Saver',
            3: 'Cautious Conservative',
            4: 'Variable Spender'
        }
        
    def train(self, X: pd.DataFrame):
        """Train clustering model"""
        if len(X) < 50:
            print("⚠️  Insufficient data for persona classification")
            return self
            
        self.model = KMeans(n_clusters=5, random_state=42, n_init=10)
        self.model.fit(X)
        print("✅ Persona Classifier trained")
        return self
    
    def predict(self, X: pd.DataFrame) -> List[str]:
        """Predict personas"""
        if self.model is None:
            return ['Unknown'] * len(X)
        clusters = self.model.predict(X)
        return [self.persona_labels.get(c, 'Unknown') for c in clusters]


# ============================================================================
# ENHANCED ANALYSIS PIPELINE
# ============================================================================

class FinSightAnalyzer:
    """Main analyzer with forecasting capabilities"""
    
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.preprocessor = DataPreprocessor()
        self.risk_predictor = RiskPredictor()
        self.anomaly_detector = AnomalyDetector()
        self.persona_classifier = PersonaClassifier()
        self.forecaster = FinancialForecaster()
        self.behavioral_analyzer = BehavioralAnalyzer()
        
        self.df_original = None
        self.df_processed = None
        self.X = None
        self.y = None
        self.forecasts = {}
        
    def load_and_process(self):
        """Load and process the CSV data"""
        print("\n🚀 Starting FinSight Enhanced Analysis Pipeline...")
        
        self.df_original = self.preprocessor.load_data(self.csv_path)
        
        print("⚙️  Processing features...")
        self.X, self.y = self.preprocessor.prepare_dataset(self.df_original)
        self.df_processed = self.preprocessor.engineer_features(self.df_original)
        
        print(f"✅ Processed {len(self.df_processed)} transactions")
        print(f"📊 Generated {len(self.preprocessor.feature_cols)} features")
        
        print("\n🤖 Training ML models...")
        self.risk_predictor.train(self.X, self.y)
        self.anomaly_detector.train(self.X)
        self.persona_classifier.train(self.X)
        
        self.df_processed['Predicted_Risk'] = self.risk_predictor.predict(self.X)
        self.df_processed['Is_Anomaly'] = self.anomaly_detector.detect(self.X)
        self.df_processed['Persona'] = self.persona_classifier.predict(self.X)
        
        print("✅ All models trained and predictions added")
        
        # Generate forecasts
        print("\n🔮 Generating forecasts...")
        self.generate_forecasts()
        
    def generate_forecasts(self):
        """Generate all forecasts"""
        print("  📈 Forecasting with Prophet...")
        prophet_forecast = self.forecaster.forecast_with_prophet(self.df_processed)
        
        print("  🧠 Forecasting with LSTM...")
        lstm_forecast = self.forecaster.forecast_with_lstm(self.df_processed)
        
        # Use Prophet forecast for balance projection
        if prophet_forecast:
            print("  💰 Projecting balance...")
            balance_forecast = self.forecaster.forecast_balance(self.df_processed, prophet_forecast)
            
            print("  📊 Forecasting by category...")
            category_forecast = self.forecaster.forecast_category_spending(self.df_processed)
            
            self.forecasts = {
                'prophet': prophet_forecast,
                'lstm': lstm_forecast,
                'balance': balance_forecast,
                'categories': category_forecast
            }
            
            print("✅ Forecasting complete")
        else:
            print("⚠️  Forecasting skipped due to insufficient data")
            self.forecasts = {}
    
    def generate_summary_stats(self) -> Dict:
        """Generate summary statistics"""
        df = self.df_processed
        
        stats = {
            'total_transactions': len(df),
            'date_range': {
                'start': df['DateTime'].min().strftime('%Y-%m-%d'),
                'end': df['DateTime'].max().strftime('%Y-%m-%d'),
                'days': (df['DateTime'].max() - df['DateTime'].min()).days
            },
            'spending': {
                'total': float(df['Amount'].sum()),
                'average': float(df['Amount'].mean()),
                'median': float(df['Amount'].median()),
                'std': float(df['Amount'].std()),
                'min': float(df['Amount'].min()),
                'max': float(df['Amount'].max())
            },
            'balance': {
                'current': float(df['Balance_After'].iloc[-1]),
                'average': float(df['Balance_After'].mean()),
                'min': float(df['Balance_After'].min()),
                'max': float(df['Balance_After'].max())
            },
            'risk': {
                'average_score': float(df['Risk_Score'].mean()),
                'high_risk_count': int((df['Risk_Score'] > 0.7).sum()),
                'high_risk_percentage': float((df['Risk_Score'] > 0.7).sum() / len(df) * 100)
            },
            'anomalies': {
                'count': int((df['Is_Anomaly'] == -1).sum()),
                'percentage': float((df['Is_Anomaly'] == -1).sum() / len(df) * 100)
            }
        }
        
        return stats
    
    def analyze_categories(self) -> Dict:
        """Analyze spending by category"""
        df = self.df_processed
        
        category_analysis = df.groupby('Category').agg({
            'Amount': ['sum', 'mean', 'count'],
            'Risk_Score': 'mean'
        }).round(2)
        
        category_analysis.columns = ['Total', 'Average', 'Count', 'Avg_Risk']
        category_analysis = category_analysis.sort_values('Total', ascending=False)
        
        return {
            'categories': category_analysis.to_dict('index'),
            'top_category': category_analysis.index[0],
            'top_spending': float(category_analysis['Total'].iloc[0])
        }
    
    def analyze_mood_impact(self) -> Dict:
        """Analyze how mood affects spending"""
        df = self.df_processed
        
        mood_analysis = df.groupby('Mood').agg({
            'Amount': ['mean', 'sum', 'count']
        }).round(2)
        
        mood_analysis.columns = ['Average', 'Total', 'Count']
        mood_analysis = mood_analysis.sort_values('Average', ascending=False)
        
        return {
            'moods': mood_analysis.to_dict('index'),
            'highest_spending_mood': mood_analysis.index[0],
            'impact_score': float(mood_analysis['Average'].std() / mood_analysis['Average'].mean())
        }
    
    def analyze_time_patterns(self) -> Dict:
        """Analyze spending patterns over time"""
        df = self.df_processed
        
        daily = df.groupby(df['DateTime'].dt.date)['Amount'].sum()
        
        weekly = df.groupby('DayOfWeek')['Amount'].mean()
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        weekly.index = [day_names[i] for i in weekly.index]
        
        hourly = df.groupby('Hour')['Amount'].mean()
        
        monthly = df.groupby(df['DateTime'].dt.to_period('M'))['Amount'].sum()
        monthly.index = monthly.index.astype(str)
        
        return {
            'daily_average': float(daily.mean()),
            'daily_trend': {str(k): float(v) for k, v in daily.tail(30).items()},
            'weekly_pattern': weekly.to_dict(),
            'hourly_pattern': hourly.to_dict(),
            'monthly_trend': monthly.to_dict(),
            'weekend_vs_weekday': {
                'weekend': float(df[df['IsWeekend'] == 1]['Amount'].mean()),
                'weekday': float(df[df['IsWeekend'] == 0]['Amount'].mean())
            }
        }
    
    def analyze_locations(self) -> Dict:
        """Analyze spending by location"""
        df = self.df_processed
        
        location_analysis = df.groupby('Location').agg({
            'Amount': ['sum', 'mean', 'count']
        }).round(2)
        
        location_analysis.columns = ['Total', 'Average', 'Count']
        location_analysis = location_analysis.sort_values('Total', ascending=False)
        
        return {
            'locations': location_analysis.to_dict('index'),
            'top_location': location_analysis.index[0]
        }
    
    def analyze_merchants(self) -> Dict:
        """Analyze top merchants"""
        df = self.df_processed
        
        merchant_analysis = df.groupby('Merchant').agg({
            'Amount': ['sum', 'count']
        }).round(2)
        
        merchant_analysis.columns = ['Total', 'Count']
        merchant_analysis = merchant_analysis.sort_values('Total', ascending=False).head(10)
        
        return {
            'top_merchants': merchant_analysis.to_dict('index')
        }
    
    def analyze_personas(self) -> Dict:
        """Analyze spending personas"""
        df = self.df_processed
        
        persona_analysis = df.groupby('Persona').agg({
            'Amount': ['mean', 'count'],
            'Risk_Score': 'mean'
        }).round(2)
        
        persona_analysis.columns = ['Avg_Spending', 'Count', 'Avg_Risk']
        
        return {
            'personas': persona_analysis.to_dict('index'),
            'dominant_persona': persona_analysis['Count'].idxmax()
        }
    
    def get_enhanced_recommendations(self) -> List[str]:
        """Generate enhanced personalized recommendations"""
        df = self.df_processed
        recommendations = []
        
        # Get behavioral insights
        behavioral_insights = self.behavioral_analyzer.generate_all_insights(df)
        recommendations.extend(behavioral_insights)
        
        # Balance-based
        current_balance = df['Balance_After'].iloc[-1]
        avg_balance = df['Balance_After'].mean()
        
        if current_balance < 1000:
            recommendations.append(
                f"⚠️ Low balance alert (₹{current_balance:.2f}). Prioritize essential expenses."
            )
        elif current_balance < avg_balance * 0.5:
            recommendations.append(
                f"💰 Balance below average (₹{current_balance:.2f} vs ₹{avg_balance:.2f}). Consider reducing spending."
            )
        
        # Forecast-based recommendations
        if 'prophet' in self.forecasts and self.forecasts['prophet']:
            forecast_total = self.forecasts['prophet']['total_forecast']
            horizon_days = self.forecasts['prophet'].get('horizon_days', 30)
            current_monthly = df['Amount'].sum() / max(1, (df['DateTime'].max() - df['DateTime'].min()).days) * 30
            
            if forecast_total > current_monthly * 1.2:
                recommendations.append(
                    f"📈 Forecast Alert: Next {horizon_days} day(s) spending projected at ₹{forecast_total:.0f}, "
                    f"which is {((forecast_total/current_monthly - 1) * 100):.0f}% higher than current rate. "
                    f"Consider budget adjustments."
                )
        
        if 'balance' in self.forecasts and self.forecasts['balance']:
            end_balance = self.forecasts['balance']['end_balance']
            min_balance = self.forecasts['balance']['min_balance']
            
            if end_balance < current_balance * 0.7:
                recommendations.append(
                    f"💸 Balance Warning: Projected end-of-month balance (₹{end_balance:.0f}) "
                    f"is {((1 - end_balance/current_balance) * 100):.0f}% lower than current. Plan accordingly."
                )
            
            if min_balance < 500:
                recommendations.append(
                    f"🚨 Low Balance Risk: Balance may drop to ₹{min_balance:.0f} within the remaining days of this month. "
                    f"Maintain emergency buffer."
                )
        
        # Risk-based
        avg_risk = df['Risk_Score'].mean()
        recent_risk = df['Risk_Score'].tail(10).mean()
        
        if recent_risk > avg_risk * 1.2:
            recommendations.append(
                f"📈 Risk increasing recently ({recent_risk:.2f} vs {avg_risk:.2f}). Be cautious with discretionary spending."
            )
        
        # Anomaly-based
        anomaly_count = (df['Is_Anomaly'] == -1).sum()
        if anomaly_count > 0:
            recommendations.append(
                f"🔍 {anomaly_count} unusual transactions detected. Review for unauthorized activity."
            )
        
        # Category forecast recommendations
        if 'categories' in self.forecasts and self.forecasts['categories']:
            top_forecast_cat = max(self.forecasts['categories'].items(), 
                                  key=lambda x: x[1]['total'])
            cat_name, cat_forecast = top_forecast_cat
            
            recommendations.append(
                f"📊 Category Forecast: '{cat_name}' expected to cost ₹{cat_forecast['total']:.0f} "
                f"until month end (₹{cat_forecast['daily_avg']:.0f}/day). Budget accordingly."
            )
        
        # Positive reinforcements
        if avg_risk < 0.4:
            recommendations.append("🌟 Great risk management! Your spending patterns show good financial discipline.")
        
        balance_trend = df['Balance_After'].tail(30).mean() - df['Balance_After'].head(30).mean()
        if balance_trend > 0:
            recommendations.append(f"💪 Positive trend: Balance increased by ₹{balance_trend:.0f} recently. Keep it up!")
        
        return recommendations if recommendations else ["✅ Your finances look healthy! Keep up the good work."]


# ============================================================================
# HTML REPORT GENERATOR (ENHANCED)
# ============================================================================

class HTMLReportGenerator:
    """Generates enhanced interactive HTML dashboard"""
    
    def __init__(self, analyzer: FinSightAnalyzer):
        self.analyzer = analyzer
        
    def generate_forecast_section_html(self) -> str:
        """Generate HTML for forecast section"""
        forecasts = self.analyzer.forecasts or {}
        if not forecasts:
            return ""
        
        prophet = forecasts.get('prophet')
        lstm = forecasts.get('lstm')
        balance = forecasts.get('balance')
        categories = forecasts.get('categories')
        
        if not prophet and not lstm:
            return ""
        
        html = '<div class="section forecast-section">'
        horizon_days = (prophet.get('horizon_days') if isinstance(prophet, dict) and prophet else 
                        (lstm.get('horizon_days') if isinstance(lstm, dict) and lstm else None))
        title_suffix = f" for next {horizon_days} day(s)" if horizon_days else ""
        html += f'<h2>🔮 Projected Until Month End{title_suffix}</h2>'
        
        if prophet:
            html += '<div class="stats-grid">'
            html += f'''
            <div class="stat-card forecast-card">
                <h3>📈 Projected Expenses</h3>
                <div class="value">₹{prophet['total_forecast']:,.0f}</div>
                <div class="label">Total until month end</div>
            </div>
            <div class="stat-card forecast-card">
                <h3>📅 Daily Average</h3>
                <div class="value">₹{prophet['avg_daily']:,.0f}</div>
                <div class="label">Expected daily spending</div>
            </div>
            '''
            if balance:
                html += f'''
                <div class="stat-card forecast-card">
                    <h3>💰 Projected Balance</h3>
                    <div class="value">₹{balance['end_balance']:,.0f}</div>
                    <div class="label">End of month balance</div>
                </div>
                <div class="stat-card forecast-card">
                    <h3>⚠️ Minimum Balance</h3>
                    <div class="value">₹{balance['min_balance']:,.0f}</div>
                    <div class="label">Lowest expected balance</div>
                </div>
                '''
            html += '</div>'
            
            if lstm:
                html += '<div class="insight-box" style="margin-top: 20px;">'
                html += f'''
                <strong>📊 Model Comparison:</strong><br>
                • Prophet Forecast: ₹{prophet['total_forecast']:,.0f} total<br>
                • LSTM Forecast: ₹{lstm['total_forecast']:,.0f} total<br>
                • Average Prediction: ₹{(prophet['total_forecast'] + lstm['total_forecast'])/2:,.0f}
                '''
                html += '</div>'
        
        if categories:
            html += '<h3 style="color: #667eea; margin: 30px 0 15px 0;">Category-wise Forecast (Until Month End)</h3>'
            html += '<table><thead><tr><th>Category</th><th>Projected Total</th><th>Daily Average</th><th>Visual</th></tr></thead><tbody>'
            max_cat_total = max(c['total'] for c in categories.values()) if len(categories) > 0 else 1
            for cat, forecast in sorted(categories.items(), key=lambda x: x[1]['total'], reverse=True):
                html += f'''
                <tr>
                    <td><strong>{cat}</strong></td>
                    <td>₹{forecast['total']:,.2f}</td>
                    <td>₹{forecast['daily_avg']:,.2f}</td>
                    <td>
                        <div class="chart-bar" style="width: {(forecast['total'] / max_cat_total * 100):.0f}%"></div>
                    </td>
                </tr>
                '''
            html += '</tbody></table>'
        
        html += '</div>'
        return html
    
    def generate_anomaly_details_html(self) -> str:
        """Generate HTML for anomaly details"""
        df = self.analyzer.df_processed
        anomaly_indices = df['Is_Anomaly'].values
        
        if (anomaly_indices == -1).sum() == 0:
            return ""
        
        anomaly_details = self.analyzer.anomaly_detector.get_anomaly_details(df, anomaly_indices)
        
        html = '<div class="section">'
        html += '<h2>🚨 Detailed Anomaly Analysis</h2>'
        html += '<table><thead><tr><th>Date</th><th>Merchant</th><th>Amount</th><th>Category</th><th>Reason</th></tr></thead><tbody>'
        
        for detail in anomaly_details:
            html += f'''
            <tr>
                <td>{detail['date']}</td>
                <td><strong>{detail['merchant']}</strong></td>
                <td><span class="badge badge-danger">₹{detail['amount']:,.2f}</span></td>
                <td>{detail['category']}</td>
                <td>{detail['reason']}</td>
            </tr>
            '''
        
        html += '</tbody></table></div>'
        return html
        
    def generate_html(self, output_path: str = "finsight_report.html"):
        """Generate complete enhanced HTML report"""
        
        summary = self.analyzer.generate_summary_stats()
        categories = self.analyzer.analyze_categories()
        mood_impact = self.analyzer.analyze_mood_impact()
        time_patterns = self.analyzer.analyze_time_patterns()
        locations = self.analyzer.analyze_locations()
        merchants = self.analyzer.analyze_merchants()
        personas = self.analyzer.analyze_personas()
        recommendations = self.analyzer.get_enhanced_recommendations()
        
        forecast_html = self.generate_forecast_section_html()
        anomaly_html = self.generate_anomaly_details_html()
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinSight Enhanced - Financial Intelligence Report</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        
        .header {{
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 30px;
            text-align: center;
        }}
        
        .header h1 {{
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        .header .subtitle {{
            color: #666;
            font-size: 1.2em;
            margin-top: 10px;
        }}
        
        .header p {{
            color: #999;
            font-size: 0.95em;
            margin-top: 15px;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .stat-card {{
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }}
        
        .stat-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }}
        
        .forecast-card {{
            background: linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 100%);
            border-left: 5px solid #667eea;
        }}
        
        .stat-card h3 {{
            color: #667eea;
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }}
        
        .stat-card .value {{
            font-size: 2em;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }}
        
        .stat-card .label {{
            color: #999;
            font-size: 0.9em;
        }}
        
        .section {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }}
        
        .forecast-section {{
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #667eea;
        }}
        
        .section h2 {{
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }}
        
        table th {{
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #667eea;
            border-bottom: 2px solid #dee2e6;
        }}
        
        table td {{
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }}
        
        table tr:hover {{
            background: #f8f9fa;
        }}
        
        .recommendation {{
            background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin: 10px 0;
            border-radius: 5px;
            transition: transform 0.2s;
        }}
        
        .recommendation:hover {{
            transform: translateX(5px);
            background: linear-gradient(135deg, #e3f2fd 0%, #d1ecf1 100%);
        }}
        
        .badge {{
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-right: 5px;
        }}
        
        .badge-success {{
            background: #d4edda;
            color: #155724;
        }}
        
        .badge-warning {{
            background: #fff3cd;
            color: #856404;
        }}
        
        .badge-danger {{
            background: #f8d7da;
            color: #721c24;
        }}
        
        .badge-info {{
            background: #d1ecf1;
            color: #0c5460;
        }}
        
        .progress-bar {{
            width: 100%;
            height: 10px;
            background: #e9ecef;
            border-radius: 5px;
            overflow: hidden;
            margin: 10px 0;
        }}
        
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s;
        }}
        
        .grid-2 {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }}
        
        .insight-box {{
            background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            border-left: 5px solid #f39c12;
        }}
        
        .chart-bar {{
            height: 30px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 5px;
            margin: 10px 0;
            position: relative;
            overflow: hidden;
        }}
        
        .chart-bar::after {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
        }}
        
        @keyframes shimmer {{
            0% {{ transform: translateX(-100%); }}
            100% {{ transform: translateX(100%); }}
        }}
        
        .highlight {{
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white;
            padding: 3px 8px;
            border-radius: 5px;
            font-weight: bold;
        }}
        
        @media (max-width: 768px) {{
            .stats-grid {{
                grid-template-columns: 1fr;
            }}
            .grid-2 {{
                grid-template-columns: 1fr;
            }}
            .header h1 {{
                font-size: 1.8em;
            }}
        }}
        
        .footer {{
            text-align: center;
            padding: 30px;
            color: white;
            margin-top: 30px;
        }}
        
        .anomaly-alert {{
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
        }}
        
        .new-badge {{
            background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
            color: white;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 0.75em;
            font-weight: bold;
            margin-left: 10px;
            animation: pulse 2s infinite;
        }}
        
        @keyframes pulse {{
            0%, 100% {{ opacity: 1; }}
            50% {{ opacity: 0.7; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>💰 FinSight Enhanced Dashboard</h1>
            <div class="subtitle">Financial Intelligence & Predictive Analytics<span class="new-badge">AI-POWERED</span></div>
            <p style="margin-top: 10px; color: #999;">Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
        </div>
        
        <!-- Summary Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Transactions</h3>
                <div class="value">{summary['total_transactions']}</div>
                <div class="label">{summary['date_range']['days']} days of data</div>
            </div>
            <div class="stat-card">
                <h3>Total Spending</h3>
                <div class="value">₹{summary['spending']['total']:,.0f}</div>
                <div class="label">Avg: ₹{summary['spending']['average']:,.2f}</div>
            </div>
            <div class="stat-card">
                <h3>Current Balance</h3>
                <div class="value">₹{summary['balance']['current']:,.0f}</div>
                <div class="label">Range: ₹{summary['balance']['min']:,.0f} - ₹{summary['balance']['max']:,.0f}</div>
            </div>
            <div class="stat-card">
                <h3>Risk Score</h3>
                <div class="value">{summary['risk']['average_score']:.2f}</div>
                <div class="label">{summary['risk']['high_risk_count']} high-risk transactions</div>
            </div>
            <div class="stat-card">
                <h3>Anomalies Detected</h3>
                <div class="value">{summary['anomalies']['count']}</div>
                <div class="label">{summary['anomalies']['percentage']:.1f}% of transactions</div>
            </div>
        </div>

        <!-- Anomaly Alert -->
        {f'''
        <div class="anomaly-alert">
            <strong>⚠️ Anomaly Alert:</strong> {summary['anomalies']['count']} unusual transactions detected. 
            These may require review for unauthorized activity or data entry errors.
        </div>
        ''' if summary['anomalies']['count'] > 0 else ''}

        <!-- Recommendations -->
        <div class="section">
            <h2>💡 Personalized Recommendations</h2>
            {''.join([f'<div class="recommendation">{rec}</div>' for rec in recommendations])}
        </div>

        <!-- Forecast Section -->
        {forecast_html}

        <!-- Spending Personas -->
        <div class="section">
            <h2>👥 Spending Personas Analysis</h2>
            <div class="insight-box">
                <strong>Dominant Persona:</strong> <span class="highlight">{personas['dominant_persona']}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Persona</th>
                        <th>Transaction Count</th>
                        <th>Avg Spending</th>
                        <th>Avg Risk</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f'''
                    <tr>
                        <td><strong>{persona}</strong></td>
                        <td>{int(data['Count'])}</td>
                        <td>₹{data['Avg_Spending']:,.2f}</td>
                        <td><span class="badge badge-{'danger' if data['Avg_Risk'] > 0.7 else 'warning' if data['Avg_Risk'] > 0.5 else 'success'}">{data['Avg_Risk']:.2f}</span></td>
                    </tr>
                    ''' for persona, data in personas['personas'].items()])}
                </tbody>
            </table>
        </div>

        <!-- Category Analysis -->
        <div class="section">
            <h2>📊 Spending by Category</h2>
            <div class="insight-box">
                <strong>Top Category:</strong> <span class="highlight">{categories['top_category']}</span> with 
                <span class="highlight">₹{categories['top_spending']:,.0f}</span> total spending
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Total Spent</th>
                        <th>Average</th>
                        <th>Transactions</th>
                        <th>Avg Risk</th>
                        <th>Visual</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f'''
                    <tr>
                        <td><strong>{cat}</strong></td>
                        <td>₹{data['Total']:,.2f}</td>
                        <td>₹{data['Average']:,.2f}</td>
                        <td>{int(data['Count'])}</td>
                        <td><span class="badge badge-{'danger' if data['Avg_Risk'] > 0.7 else 'warning' if data['Avg_Risk'] > 0.5 else 'success'}">{data['Avg_Risk']:.2f}</span></td>
                        <td>
                            <div class="chart-bar" style="width: {(data['Total'] / categories['top_spending'] * 100):.0f}%"></div>
                        </td>
                    </tr>
                    ''' for cat, data in categories['categories'].items()])}
                </tbody>
            </table>
        </div>

        <!-- Mood Impact and Locations -->
        <div class="grid-2">
            <div class="section">
                <h2>😊 Mood Impact on Spending</h2>
                <div class="insight-box">
                    <strong>Highest spending mood:</strong> <span class="highlight">{mood_impact['highest_spending_mood']}</span><br>
                    <strong>Mood impact score:</strong> <span class="highlight">{mood_impact['impact_score']:.2f}</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Mood</th>
                            <th>Avg Spending</th>
                            <th>Total</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join([f'''
                        <tr>
                            <td><strong>{mood}</strong></td>
                            <td>₹{data['Average']:,.2f}</td>
                            <td>₹{data['Total']:,.2f}</td>
                            <td>{int(data['Count'])}</td>
                        </tr>
                        ''' for mood, data in mood_impact['moods'].items()])}
                    </tbody>
                </table>
            </div>
            <div class="section">
                <h2>📍 Spending by Location</h2>
                <div class="insight-box">
                    <strong>Top spending location:</strong> <span class="highlight">{locations['top_location']}</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Total</th>
                            <th>Average</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join([f'''
                        <tr>
                            <td><strong>{loc}</strong></td>
                            <td>₹{data['Total']:,.2f}</td>
                            <td>₹{data['Average']:,.2f}</td>
                            <td>{int(data['Count'])}</td>
                        </tr>
                        ''' for loc, data in locations['locations'].items()])}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Time Patterns -->
        <div class="section">
            <h2>⏰ Time-based Spending Patterns</h2>
            <h3 style="color: #667eea; margin: 20px 0 15px 0;">Weekend vs Weekday Analysis</h3>
            <div class="grid-2">
                <div>
                    <p><strong>Weekend Average:</strong> ₹{time_patterns['weekend_vs_weekday']['weekend']:,.2f}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {(time_patterns['weekend_vs_weekday']['weekend'] / (time_patterns['weekend_vs_weekday']['weekend'] + time_patterns['weekend_vs_weekday']['weekday']) * 100 if (time_patterns['weekend_vs_weekday']['weekend'] + time_patterns['weekend_vs_weekday']['weekday']) > 0 else 0):.0f}%"></div>
                    </div>
                </div>
                <div>
                    <p><strong>Weekday Average:</strong> ₹{time_patterns['weekend_vs_weekday']['weekday']:,.2f}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {(time_patterns['weekend_vs_weekday']['weekday'] / (time_patterns['weekend_vs_weekday']['weekend'] + time_patterns['weekend_vs_weekday']['weekday']) * 100 if (time_patterns['weekend_vs_weekday']['weekend'] + time_patterns['weekend_vs_weekday']['weekday']) > 0 else 0):.0f}%"></div>
                    </div>
                </div>
            </div>
            <h3 style="color: #667eea; margin: 30px 0 15px 0;">Weekly Spending Pattern</h3>
            <table>
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Average Spending</th>
                        <th>Visual</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f'''
                    <tr>
                        <td><strong>{day}</strong></td>
                        <td>₹{amount:,.2f}</td>
                        <td>
                            <div class="chart-bar" style="width: {(amount / max(time_patterns['weekly_pattern'].values()) * 100):.0f}%"></div>
                        </td>
                    </tr>
                    ''' for day, amount in time_patterns['weekly_pattern'].items()])}
                </tbody>
            </table>
            <h3 style="color: #667eea; margin: 30px 0 15px 0;">Hourly Spending Pattern</h3>
            <table>
                <thead>
                    <tr>
                        <th>Hour</th>
                        <th>Average Spending</th>
                        <th>Visual</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f'''
                    <tr>
                        <td><strong>{hour}:00</strong></td>
                        <td>₹{amount:,.2f}</td>
                        <td>
                            <div class="chart-bar" style="width: {(amount / max(time_patterns['hourly_pattern'].values()) * 100) if max(time_patterns['hourly_pattern'].values()) > 0 else 0:.0f}%"></div>
                        </td>
                    </tr>
                    ''' for hour, amount in sorted(time_patterns['hourly_pattern'].items())])}
                </tbody>
            </table>
            <h3 style="color: #667eea; margin: 30px 0 15px 0;">Monthly Spending Trend</h3>
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Total Spending</th>
                        <th>Visual</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f'''
                    <tr>
                        <td><strong>{month}</strong></td>
                        <td>₹{amount:,.2f}</td>
                        <td>
                            <div class="chart-bar" style="width: {(amount / max(time_patterns['monthly_trend'].values()) * 100) if max(time_patterns['monthly_trend'].values()) > 0 else 0:.0f}%"></div>
                        </td>
                    </tr>
                    ''' for month, amount in time_patterns['monthly_trend'].items()])}
                </tbody>
            </table>
        </div>

        <!-- Top Merchants -->
        <div class="section">
            <h2>🏪 Top Merchants</h2>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Merchant</th>
                        <th>Total Spent</th>
                        <th>Transactions</th>
                        <th>Visual</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f'''
                    <tr>
                        <td><span class="badge badge-info">#{idx + 1}</span></td>
                        <td><strong>{merchant}</strong></td>
                        <td>₹{data['Total']:,.2f}</td>
                        <td>{int(data['Count'])}</td>
                        <td>
                            <div class="chart-bar" style="width: {(data['Total'] / list(merchants['top_merchants'].values())[0]['Total'] * 100):.0f}%"></div>
                        </td>
                    </tr>
                    ''' for idx, (merchant, data) in enumerate(merchants['top_merchants'].items())])}
                </tbody>
            </table>
        </div>

        <!-- Spending Statistics Summary -->
        <div class="section">
            <h2>📈 Spending Statistics Summary</h2>
            <div class="grid-2">
                <div>
                    <h3 style="color: #667eea; margin-bottom: 15px;">Amount Distribution</h3>
                    <table>
                        <tr>
                            <td><strong>Minimum:</strong></td>
                            <td>₹{summary['spending']['min']:,.2f}</td>
                        </tr>
                        <tr>
                            <td><strong>Maximum:</strong></td>
                            <td>₹{summary['spending']['max']:,.2f}</td>
                        </tr>
                        <tr>
                            <td><strong>Average:</strong></td>
                            <td>₹{summary['spending']['average']:,.2f}</td>
                        </tr>
                        <tr>
                            <td><strong>Median:</strong></td>
                            <td>₹{summary['spending']['median']:,.2f}</td>
                        </tr>
                        <tr>
                            <td><strong>Std Deviation:</strong></td>
                            <td>₹{summary['spending']['std']:,.2f}</td>
                        </tr>
                    </table>
                </div>
                <div>
                    <h3 style="color: #667eea; margin-bottom: 15px;">Balance Information</h3>
                    <table>
                        <tr>
                            <td><strong>Current Balance:</strong></td>
                            <td>₹{summary['balance']['current']:,.2f}</td>
                        </tr>
                        <tr>
                            <td><strong>Average Balance:</strong></td>
                            <td>₹{summary['balance']['average']:,.2f}</td>
                        </tr>
                        <tr>
                            <td><strong>Minimum Balance:</strong></td>
                            <td>₹{summary['balance']['min']:,.2f}</td>
                        </tr>
                        <tr>
                            <td><strong>Maximum Balance:</strong></td>
                            <td>₹{summary['balance']['max']:,.2f}</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>

        <!-- Date Range Info -->
        <div class="section">
            <h2>📅 Analysis Period</h2>
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 0.9em; color: #999; margin-bottom: 5px;">START DATE</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">{summary['date_range']['start']}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 0.9em; color: #999; margin-bottom: 5px;">END DATE</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">{summary['date_range']['end']}</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 0.9em; color: #999; margin-bottom: 5px;">DURATION</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #667eea;">{summary['date_range']['days']} days</div>
                </div>
            </div>
        </div>

        <!-- Detailed Anomaly Analysis -->
        {anomaly_html}

        <!-- Footer -->
        <div class="footer">
            <h3>💰 FinSight Enhanced - Financial Intelligence System</h3>
            <p style="margin-top: 10px; opacity: 0.9;">Powered by Machine Learning & Advanced Analytics</p>
            <p style="margin-top: 5px; opacity: 0.8;">© 2025 FinSight Analytics</p>
        </div>
    </div>
</body>
</html>
"""
        
        # Write to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"\n✅ HTML report generated: {output_path}")
        return output_path


# ============================================================================
# DEBUG AND VALIDATION UTILITIES
# ============================================================================

def debug_csv_data(filepath: str):
    """Debug and validate CSV data to identify issues"""
    print(f"\n🔍 Debugging CSV file: {filepath}")
    print("="*50)
    
    try:
        df = pd.read_csv(filepath)
        print(f"✅ File loaded successfully")
        print(f"📊 Shape: {df.shape[0]} rows, {df.shape[1]} columns")
        print(f"📋 Columns: {list(df.columns)}")
        
        required_cols = ['Date', 'Time', 'Merchant', 'Amount', 'Category', 
                        'Mood', 'Location', 'Calendar_Event', 'Group_ID', 'Balance_After']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            print(f"❌ Missing columns: {missing_cols}")
        else:
            print("✅ All required columns present")
        
        print("\n📋 Data Type Analysis:")
        for col in df.columns:
            print(f"  {col}:")
            print(f"    Type: {df[col].dtype}")
            print(f"    Non-null: {df[col].count()}/{len(df)}")
            print(f"    Sample values: {df[col].dropna().head(3).tolist()}")
            
            if col in ['Amount', 'Balance_After', 'Group_ID']:
                non_numeric = pd.to_numeric(df[col], errors='coerce').isna()
                if non_numeric.sum() > 0:
                    print(f"    ⚠️ Non-numeric values found: {non_numeric.sum()}")
                    problematic_values = df[non_numeric][col].unique()[:5]
                    print(f"    Problematic values: {problematic_values}")
        
        print(f"\n📊 Missing Values:")
        missing = df.isnull().sum()
        for col, count in missing[missing > 0].items():
            print(f"  {col}: {count} missing ({count/len(df)*100:.1f}%)")
        
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            print(f"\n⚠️ Found {duplicates} duplicate rows")
        
        print(f"\n✅ Debug analysis complete")
        
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    return True


# ============================================================================
# USER MANAGEMENT AND MAIN APPLICATION
# ============================================================================

def ensure_user_dir(username: str) -> str:
    base_dir = os.path.join(os.getcwd(), 'user_data')
    user_dir = os.path.join(base_dir, username)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir

def list_existing_users() -> List[str]:
    base_dir = os.path.join(os.getcwd(), 'user_data')
    if not os.path.isdir(base_dir):
        return []
    return [name for name in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, name))]

def prompt_user_selection() -> Tuple[str, str]:
    print("\n👤 User Selection:")
    users = list_existing_users()
    if users:
        print("Existing users:")
        for i, u in enumerate(users, 1):
            print(f"  {i}. {u}")
        print(f"  {len(users)+1}. Create new user")
        choice = input("Select an option: ").strip()
        try:
            idx = int(choice)
            if 1 <= idx <= len(users):
                username = users[idx-1]
            else:
                username = input("Enter new username: ").strip() or 'default'
        except:
            username = input("Enter username: ").strip() or 'default'
    else:
        username = input("Enter username: ").strip() or 'default'
    
    csv_path = input(f"Enter CSV path for {username} (press Enter to use default '{CSV_FILE_PATH}'): ").strip()
    if not csv_path:
        csv_path = CSV_FILE_PATH
    return username, csv_path

def run_analysis_for_user(username: str, csv_path: str) -> Optional[str]:
    try:
        user_dir = ensure_user_dir(username)
        print(f"\n📂 Working directory: {user_dir}")
        
        analyzer = FinSightAnalyzer(csv_path)
        analyzer.load_and_process()
        
        report_generator = HTMLReportGenerator(analyzer)
        output_file = os.path.join(user_dir, f"finsight_report_{username}.html")
        report_generator.generate_html(output_file)
        
        return output_file
    except Exception as e:
        print(f"❌ Failed to run analysis for {username}: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    import sys
    print("\n" + "="*70)
    print("🚀 FinSight Enhanced - Financial Intelligence Dashboard")
    print("="*70 + "\n")
    
    # Debug mode
    if len(sys.argv) > 1 and sys.argv[1] == '--debug':
        path = CSV_FILE_PATH
        if len(sys.argv) > 2:
            path = sys.argv[2]
        if os.path.exists(path):
            debug_csv_data(path)
        else:
            print(f"❌ CSV file not found: {path}")
        return
    
    username, csv_path = prompt_user_selection()
    if not os.path.exists(csv_path):
        print(f"❌ Error: CSV file not found at '{csv_path}'")
        print("\n📋 Required CSV columns: Date, Time, Merchant, Amount, Category, Mood, Location, Calendar_Event, Group_ID, Balance_After")
        print(f"💡 To debug your CSV, run: python {os.path.basename(__file__)} --debug \"<path-to-csv>\"")
        return
    
    output = run_analysis_for_user(username, csv_path)
    if output:
        print("\n" + "="*70)
        print("✅ Analysis Complete!")
        print("="*70)
        print(f"\n📄 Report saved to: {output}")
        try:
            import webbrowser
            webbrowser.open(f"file://{os.path.abspath(output)}")
            print("\n🌐 Dashboard opened in your default browser")
        except:
            print(f"\n💡 Please manually open: {os.path.abspath(output)}")
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    main()