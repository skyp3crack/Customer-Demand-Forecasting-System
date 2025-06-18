import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, timedelta

# Configuration
DATA_PATH = "dataset/salesdaily.csv"
WEATHER_PATH = "dataset/weather/perlis_7day.csv"
MODEL_DIR = "saved_models"
FORECAST_DAYS = 7  # Number of days to forecast
OUTPUT_PATH = "drug_forecasts.csv"

# Drug codes
drug_columns = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06']

# Use current date as the forecast start date (April 29, 2025)
TODAY = datetime.now().date()
forecast_dates = pd.date_range(start=TODAY, periods=FORECAST_DAYS, freq='D')

print(f"Starting forecast from {TODAY} for next {FORECAST_DAYS} days...")

# Load dataset (historical data)
df = pd.read_csv(DATA_PATH)
df['datum'] = pd.to_datetime(df['datum'])
df = df.sort_values('datum')
df.rename(columns=lambda x: x.strip().replace(' ', '_'), inplace=True)

# Check for recent data
print(f"Historical data ends on: {df['datum'].max().date()}")
print(f"Forecasting from {forecast_dates[0].date()} to {forecast_dates[-1].date()}")

# If we have data past the previous forecast start date, we can use it
# This leverages new actual data that's come in since the last forecast
if df['datum'].max().date() >= datetime(2025, 4, 26).date():
    print(f"✅ Found newer data up to {df['datum'].max().date()}. Will use this for forecasting.")

# Load weather data (for future dates)
weather_df = pd.read_csv(WEATHER_PATH)
weather_df.columns = weather_df.columns.str.strip().str.replace(" ", "_").str.lower()
weather_df['date'] = pd.to_datetime(weather_df['date'])

# Encode weather types
weather_map = {
    'Clear': 0, 
    'Cloudy': 1, 
    'Rain': 2, 
    'Heavy Rain': 3,
    'Thunderstorm': 4,
    'Hazy' : 5,
    'Other': 6
}
weather_df['weather_code'] = weather_df['weather_type'].map(weather_map)
weather_df.drop(columns=['weather_type'], inplace=True)

# Prepare the original data exactly like during training to get the same feature names
print("Preparing feature names based on training data...")
df_sample = df.copy()
df_sample['Year'] = df_sample['datum'].dt.year
df_sample['Month'] = df_sample['datum'].dt.month
df_sample['Hour'] = 0
df_sample['Is_Weekend'] = df_sample['datum'].dt.dayofweek >= 5
df_sample['Weekday_Name'] = df_sample['datum'].dt.day_name()
df_sample = pd.get_dummies(df_sample, columns=['Weekday_Name'])

# Create empty forecast dataframe
forecast_results = []

# Function to get most recent actual values for a drug
def get_recent_actuals(drug_code, days=7):
    """Get the most recent actual values for a drug to use as lag features"""
    recent_df = df.sort_values('datum', ascending=False).head(days)
    recent_values = recent_df[drug_code].tolist()
    # Reverse to get in chronological order
    return recent_values[::-1]

# Generate forecasts for each drug
for drug in drug_columns:
    print(f"\n🔍 Forecasting for {drug}...")
    
    model_path = os.path.join(MODEL_DIR, f"rf_model_{drug}.pkl")
    
    if not os.path.exists(model_path):
        print(f"⚠️ Model for {drug} not found at {model_path}. Skipping.")
        continue
    
    try:
        # Load the model
        model = joblib.load(model_path)
        
        # Add lag features to the sample dataframe - just to get feature names
        df_drug = df_sample.copy()
        df_drug[f'{drug}_lag1'] = df_drug[drug].shift(1)
        df_drug[f'{drug}_lag2'] = df_drug[drug].shift(2)
        df_drug[f'{drug}_lag3'] = df_drug[drug].shift(3)
        df_drug[f'{drug}_lag7'] = df_drug[drug].shift(7)
        df_drug[f'{drug}_roll3_mean'] = df_drug[drug].shift(1).rolling(window=3).mean()
        df_drug[f'{drug}_roll7_mean'] = df_drug[drug].shift(1).rolling(window=7).mean()
        
        # Get the exact feature names from the training data
        feature_cols = [
            'Year', 'Month', 'Hour', 'Is_Weekend', 'max_temp', 'min_temp', 'weather_code'
        ] + [col for col in df_drug.columns if col.startswith('Weekday_Name_')] + [
            f'{drug}_lag1', f'{drug}_lag2', f'{drug}_lag3', f'{drug}_lag7',
            f'{drug}_roll3_mean', f'{drug}_roll7_mean'
        ]
        
        # Verify these features exist in the sample dataset (as they should from training)
        missing_features = [f for f in feature_cols if f not in df_drug.columns]
        if missing_features:
            print(f"⚠️ Cannot find expected features: {missing_features}")
            print("Checking model feature names directly...")
            
            # Get feature names directly from model if possible
            if hasattr(model, 'feature_names_in_'):
                feature_cols = model.feature_names_in_.tolist()
                print(f"Using model's feature names: {feature_cols}")
            else:
                print("❌ Cannot determine feature names. Model does not have feature_names_in_ attribute.")
                continue
        
        # For debug: print feature names we're using
        print(f"Using features (first 5): {feature_cols[:5]}...")
        
        # Calculate baseline values for initialization
        # Get mean values from last portion of historical data
        last_year_data = df[df['datum'] >= (df['datum'].max() - pd.Timedelta(days=365))]
        if len(last_year_data) < 30:  # If not enough recent data, use all data
            last_year_data = df
        
        # Historical averages to use as baselines
        avg_sales = last_year_data[drug].mean()
        avg_sales_by_month = last_year_data.groupby(last_year_data['datum'].dt.month)[drug].mean()
        avg_sales_by_weekday = last_year_data.groupby(last_year_data['datum'].dt.dayofweek)[drug].mean()
        
        print(f"  📊 Using historical average of {avg_sales:.2f} units as baseline")
        
        # Get most recent actual values to use as initialization
        recent_actuals = get_recent_actuals(drug)
        recent_actual_mean3 = np.mean(recent_actuals[-3:]) if len(recent_actuals) >= 3 else avg_sales
        recent_actual_mean7 = np.mean(recent_actuals) if len(recent_actuals) > 0 else avg_sales
        
        print(f"  📈 Using recent actual sales for lag values initialization")
        
        # Create forecast for each day in the forecast period
        drug_forecast = []
        
        for i, forecast_date in enumerate(forecast_dates):
            try:
                # Create a new row for the forecast date
                forecast_row = {}
                
                # Basic date features
                forecast_row['Year'] = forecast_date.year
                forecast_row['Month'] = forecast_date.month
                forecast_row['Hour'] = 0
                forecast_row['DayOfWeek'] = forecast_date.dayofweek
                forecast_row['Is_Weekend'] = 1 if forecast_date.dayofweek >= 5 else 0
                
                # Initialize all weekday dummy variables to 0
                for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
                    forecast_row[f'Weekday_Name_{day}'] = 0
                
                # Set the current weekday to 1
                weekday_name = forecast_date.day_name()
                forecast_row[f'Weekday_Name_{weekday_name}'] = 1
                
                # Add weather data if available for this date
                date_weather = weather_df[weather_df['date'].dt.date == forecast_date.date()]
                if not date_weather.empty:
                    forecast_row['max_temp'] = date_weather['max_temp'].values[0]
                    forecast_row['min_temp'] = date_weather['min_temp'].values[0] 
                    forecast_row['weather_code'] = date_weather['weather_code'].values[0]
                else:
                    # Use average weather data if specific data not available
                    forecast_row['max_temp'] = weather_df['max_temp'].mean()
                    forecast_row['min_temp'] = weather_df['min_temp'].mean()
                    forecast_row['weather_code'] = weather_df['weather_code'].mode()[0]
                
                # Initialize lag features
                # For the first forecast day (i=0)
                if i == 0:
                    # Use actual recent values if available, otherwise use baseline
                    if len(recent_actuals) >= 1:
                        forecast_row[f'{drug}_lag1'] = recent_actuals[-1]
                    else:
                        month_avg = avg_sales_by_month.get(forecast_date.month, avg_sales)
                        weekday_avg = avg_sales_by_weekday.get(forecast_date.dayofweek, avg_sales)
                        forecast_row[f'{drug}_lag1'] = (month_avg + weekday_avg) / 2
                        
                    if len(recent_actuals) >= 2:
                        forecast_row[f'{drug}_lag2'] = recent_actuals[-2]
                    else:
                        forecast_row[f'{drug}_lag2'] = forecast_row[f'{drug}_lag1']
                        
                    if len(recent_actuals) >= 3:
                        forecast_row[f'{drug}_lag3'] = recent_actuals[-3]
                    else:
                        forecast_row[f'{drug}_lag3'] = forecast_row[f'{drug}_lag1']
                        
                    if len(recent_actuals) >= 7:
                        forecast_row[f'{drug}_lag7'] = recent_actuals[-7]
                    else:
                        forecast_row[f'{drug}_lag7'] = forecast_row[f'{drug}_lag1']
                    
                    # Use actual rolling means if available
                    forecast_row[f'{drug}_roll3_mean'] = recent_actual_mean3
                    forecast_row[f'{drug}_roll7_mean'] = recent_actual_mean7
                    
                else:
                    # For subsequent days, use previous predictions
                    forecast_row[f'{drug}_lag1'] = drug_forecast[-1]['prediction']
                    
                    if i >= 2:
                        forecast_row[f'{drug}_lag2'] = drug_forecast[-2]['prediction']
                    else:
                        # Use actual data for remaining lag values if available
                        if len(recent_actuals) >= 1:
                            forecast_row[f'{drug}_lag2'] = recent_actuals[-1]
                        else:
                            forecast_row[f'{drug}_lag2'] = forecast_row[f'{drug}_lag1']
                        
                    if i >= 3:
                        forecast_row[f'{drug}_lag3'] = drug_forecast[-3]['prediction']
                    else:
                        # Use actual data for remaining lag values if available
                        if len(recent_actuals) >= 2 - i:
                            forecast_row[f'{drug}_lag3'] = recent_actuals[-(2-i)]
                        else:
                            forecast_row[f'{drug}_lag3'] = forecast_row[f'{drug}_lag1']
                        
                    if i >= 7:
                        forecast_row[f'{drug}_lag7'] = drug_forecast[-7]['prediction']
                    else:
                        # Use actual data for remaining lag values if available
                        if len(recent_actuals) >= 6 - i:
                            forecast_row[f'{drug}_lag7'] = recent_actuals[-(6-i)]
                        else:
                            forecast_row[f'{drug}_lag7'] = forecast_row[f'{drug}_lag1']
                    
                    # Calculate rolling means
                    if i >= 3:
                        recent_vals = [pred['prediction'] for pred in drug_forecast[-3:]]
                        forecast_row[f'{drug}_roll3_mean'] = np.mean(recent_vals)
                    else:
                        # Blend actual data with predictions for rolling mean
                        blend_vals = recent_actuals[-(3-i):] if len(recent_actuals) >= (3-i) else []
                        blend_vals.extend([pred['prediction'] for pred in drug_forecast])
                        forecast_row[f'{drug}_roll3_mean'] = np.mean(blend_vals) if blend_vals else recent_actual_mean3
                        
                    if i >= 7:
                        recent_vals = [pred['prediction'] for pred in drug_forecast[-7:]]
                        forecast_row[f'{drug}_roll7_mean'] = np.mean(recent_vals)
                    else:
                        # Blend actual data with predictions for rolling mean
                        blend_vals = recent_actuals[-(7-i):] if len(recent_actuals) >= (7-i) else []
                        blend_vals.extend([pred['prediction'] for pred in drug_forecast])
                        forecast_row[f'{drug}_roll7_mean'] = np.mean(blend_vals) if blend_vals else recent_actual_mean7
                
                # Create a DataFrame with exactly the expected features in the exact order
                X_pred = pd.DataFrame([{col: forecast_row.get(col, 0) for col in feature_cols}])
                
                # Make prediction
                prediction = model.predict(X_pred)[0]
                
                # Ensure prediction is non-negative
                prediction = max(0, prediction)
                
                # Store prediction
                drug_forecast.append({
                    'date': forecast_date,
                    'prediction': prediction
                })
                
                print(f"  📅 {forecast_date.strftime('%Y-%m-%d')}: Predicted {drug} sales = {prediction:.2f}")
                
            except Exception as e:
                print(f"❌ Error predicting {drug} for {forecast_date}: {str(e)}")
                print(f"Forecast row: {forecast_row}")
        
        # Add all predictions to results
        for day_result in drug_forecast:
            forecast_results.append({
                'Drug': drug,
                'Date': day_result['date'],
                'Predicted_Sales': day_result['prediction']
            })
            
    except Exception as e:
        print(f"❌ Error processing {drug}: {str(e)}")

# Create and save final forecast dataframe
if forecast_results:
    forecast_df = pd.DataFrame(forecast_results)
    
    # Pivot the dataframe to have drugs as columns
    pivot_df = forecast_df.pivot(index='Date', columns='Drug', values='Predicted_Sales')
    pivot_df.reset_index(inplace=True)
    
    # Save both formats
    forecast_df.to_csv(OUTPUT_PATH, index=False)
    pivot_df.to_csv("drug_forecasts_pivot.csv", index=False)
    
    print(f"\n✅ Forecast complete! Output saved to:")
    print(f"   - {OUTPUT_PATH} (long format)")
    print(f"   - drug_forecasts_pivot.csv (wide format)")
    
    # Optional: Compare with previous forecast for overlap dates
    try:
        previous_forecast = pd.read_csv("drug_forecasts_pivot.csv")
        previous_forecast['Date'] = pd.to_datetime(previous_forecast['Date'])
        
        # Find overlapping dates between old and new forecasts
        overlap_dates = set(previous_forecast['Date'].dt.date).intersection(set(pivot_df['Date'].dt.date))
        
        if overlap_dates:
            print("\n📊 Forecast comparison for overlapping dates:")
            for date in sorted(overlap_dates):
                old_row = previous_forecast[previous_forecast['Date'].dt.date == date]
                new_row = pivot_df[pivot_df['Date'].dt.date == date]
                
                print(f"  📅 {date}:")
                for drug in drug_columns:
                    if drug in old_row.columns and drug in new_row.columns:
                        old_val = old_row[drug].values[0]
                        new_val = new_row[drug].values[0]
                        diff_pct = ((new_val - old_val) / old_val) * 100 if old_val != 0 else float('inf')
                        
                        print(f"    - {drug}: Old={old_val:.2f}, New={new_val:.2f}, Diff={diff_pct:.1f}%")
    except Exception as e:
        print(f"Note: Could not compare with previous forecast: {str(e)}")
    
    # Preview results
    print("\n📊 Preview of forecasts:")
    print(pivot_df.head())
else:
    print("\n❌ No forecasts were generated. Please check your models and data.")