from skopt import BayesSearchCV
from skopt.space import Integer, Real
from sklearn.metrics import make_scorer, mean_squared_error, mean_absolute_error, r2_score, mean_absolute_percentage_error
from sklearn.ensemble import RandomForestRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.model_selection import train_test_split
import xgboost as xgb
import joblib, os, pandas as pd, numpy as np
import warnings
warnings.filterwarnings('ignore')
def safe_mape(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    mask = y_true != 0
    if np.sum(mask) == 0:
        return np.nan
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

# ----------- Configuration -----------
DATA_PATH = "dataset/salesdaily.csv"
WEATHER_PATH = "dataset/weather/perlis_7day.csv"
MODEL_DIR = "saved_models"
os.makedirs(MODEL_DIR, exist_ok=True)

# Define model types to train
MODELS = ["RandomForest", "XGBoost", "KNN"]

drug_columns = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06']

# ----------- Load Sales Data -----------
print("Loading sales data...")
df = pd.read_csv(DATA_PATH)
df['datum'] = pd.to_datetime(df['datum'])
df = df.sort_values('datum')
df.rename(columns=lambda x: x.strip().replace(' ', '_'), inplace=True)
print(f"Sales data loaded: {df.shape[0]} rows")

# ----------- Load Weather Data -----------
print("Loading weather data...")
weather_df = pd.read_csv(WEATHER_PATH)
weather_df.columns = weather_df.columns.str.strip().str.replace(" ", "_").str.lower()
weather_df['date'] = pd.to_datetime(weather_df['date'])

# Print weather data info for debugging
print(f"Weather columns: {weather_df.columns.tolist()}")
print(f"Weather types available: {weather_df['weather_type'].unique()}")

# Weather encoding (updated to match new classifications from weather.py)
weather_map = {
    'Clear': 0, 
    'Cloudy': 1, 
    'Rain': 2, 
    'Heavy Rain': 3,
    'Thunderstorm': 4,
    'Hazy' : 5,
    'Other': 6
}

# Handle any missing mappings
for weather_type in weather_df['weather_type'].unique():
    if weather_type not in weather_map:
        print(f"Adding unmapped weather type: {weather_type}")
        weather_map[weather_type] = len(weather_map)

weather_df['weather_code'] = weather_df['weather_type'].map(lambda x: weather_map.get(x, 6))  # Default to 'Other' (6)

# Drop columns we don't need
columns_to_keep = ['date', 'max_temp', 'min_temp', 'weather_code']
extra_columns = [col for col in weather_df.columns if col not in columns_to_keep and col != 'weather_type']
if extra_columns:
    print(f"Dropping extra weather columns: {extra_columns}")
    weather_df = weather_df.drop(columns=extra_columns)

weather_df.drop(columns=['weather_type'], inplace=True, errors='ignore')
print(f"Weather data loaded: {weather_df.shape[0]} rows")

# ----------- Feature Engineering -----------
print("Performing feature engineering...")
# Add time-based features to main dataframe
df['Year'] = df['datum'].dt.year
df['Month'] = df['datum'].dt.month
df['DayOfWeek'] = df['datum'].dt.dayofweek
df['Is_Weekend'] = df['DayOfWeek'] >= 5
df['Weekday_Name'] = df['datum'].dt.day_name()
df = pd.get_dummies(df, columns=['Weekday_Name'])

# ----------- Handle Data Imbalance Issues -----------
# Option 1: For historical analysis (using only available weather data)
available_dates = weather_df['date'].unique()
df_historical = df[df['datum'].isin(available_dates)].copy()

# Option 2: For future prediction (filling missing weather with averages or similar days)
# Group weather by month to get seasonal patterns
weather_df['Month'] = weather_df['date'].dt.month

# Safe aggregation function for mode that handles empty series
def safe_mode(x):
    if x.empty:
        return 0  # Default to 'Clear' if no data
    mode_result = x.mode()
    if len(mode_result) == 0:
        return 0
    return mode_result[0]

monthly_weather_avg = weather_df.groupby('Month').agg({
    'max_temp': 'mean',
    'min_temp': 'mean',
    'weather_code': safe_mode
}).reset_index()

# Function to get weather features for any date
def get_weather_features(date, weather_df, monthly_avg):
    # Try exact match first
    exact_match = weather_df[weather_df['date'] == date]
    if not exact_match.empty:
        return exact_match[['max_temp', 'min_temp', 'weather_code']].iloc[0].to_dict()
    
    # Fall back to monthly average
    month = date.month
    avg_data = monthly_avg[monthly_avg['Month'] == month]
    if not avg_data.empty:
        return avg_data[['max_temp', 'min_temp', 'weather_code']].iloc[0].to_dict()
    
    # Last resort: return global averages
    return {
        'max_temp': weather_df['max_temp'].mean() if not weather_df['max_temp'].empty else 30,
        'min_temp': weather_df['min_temp'].mean() if not weather_df['min_temp'].empty else 24,
        'weather_code': weather_df['weather_code'].mode()[0] if not weather_df['weather_code'].empty else 0
    }

# Apply weather features to all dates in sales data
print("Applying weather features to sales data...")
weather_features = []
for date in df['datum']:
    features = get_weather_features(date, weather_df, monthly_weather_avg)
    weather_features.append(features)

weather_features_df = pd.DataFrame(weather_features)
df = pd.concat([df.reset_index(drop=True), weather_features_df], axis=1)

# Define RMSE scorer
def rmse(y_true, y_pred):
    return np.sqrt(mean_squared_error(y_true, y_pred))

rmse_scorer = make_scorer(rmse, greater_is_better=False)

# ----------- Define model configurations -----------
def get_model_config(model_type):
    if model_type == "RandomForest":
        model = RandomForestRegressor(random_state=42)
        search_space = {
            'n_estimators': Integer(50, 300),
            'max_depth': Integer(3, 20),
            'min_samples_split': Integer(2, 10),
            'min_samples_leaf': Integer(1, 10)
        }
    elif model_type == "XGBoost":
        model = xgb.XGBRegressor(random_state=42)
        search_space = {
            'n_estimators': Integer(50, 300),
            'max_depth': Integer(3, 10),
            'learning_rate': Real(0.01, 0.3, prior='log-uniform'),
            'subsample': Real(0.5, 1.0),
            'colsample_bytree': Real(0.5, 1.0)
        }
    elif model_type == "KNN":
        model = KNeighborsRegressor()
        search_space = {
            'n_neighbors': Integer(3, 20),
            'weights': ['uniform', 'distance'],
            'p': Integer(1, 2)  # Manhattan or Euclidean distance
        }
    else:
        raise ValueError(f"Unsupported model type: {model_type}")
    
    return model, search_space

# ----------- Model Training Loop ----------- 
min_required_rows = 20  # Minimum data points required
all_results = []

for drug in drug_columns:
    print(f"\n🔍 Processing models for {drug}...")
    
    # Create a copy to avoid modifying the original dataframe
    df_drug = df.copy()
    
    # Add lag features specifically for this drug
    df_drug[f'{drug}_lag1'] = df_drug[drug].shift(1)
    df_drug[f'{drug}_lag2'] = df_drug[drug].shift(2)
    df_drug[f'{drug}_lag3'] = df_drug[drug].shift(3)
    df_drug[f'{drug}_lag7'] = df_drug[drug].shift(7)
    df_drug[f'{drug}_roll3_mean'] = df_drug[drug].shift(1).rolling(window=3).mean()
    df_drug[f'{drug}_roll7_mean'] = df_drug[drug].shift(1).rolling(window=7).mean()
    
    # Drop rows with NaN values
    df_model = df_drug.dropna().copy()

    # Skip if not enough data
    if df_model.shape[0] < min_required_rows:
        print(f"⚠️ Not enough data for {drug} (only {df_model.shape[0]} rows). Skipping.")
        continue

    # Feature list - EXCLUDE weather features
    feature_cols = ['Year', 'Month', 'DayOfWeek', 'Is_Weekend'] + \
                  [col for col in df_model.columns if col.startswith('Weekday_Name_')] + \
                  [f'{drug}_lag1', f'{drug}_lag2', f'{drug}_lag3', f'{drug}_lag7',
                   f'{drug}_roll3_mean', f'{drug}_roll7_mean']
    
    # Verify all features exist
    missing_features = [f for f in feature_cols if f not in df_model.columns]
    if missing_features:
        print(f"⚠️ Missing features: {missing_features}")
        continue
        
    X = df_model[feature_cols]
    y = df_model[drug]
    
    print(f"Training with {X.shape[0]} samples and {X.shape[1]} features")
    
    # --- NEW: Split into train, validation, and test sets ---
    # First, split off the test set (20%)
    X_trainval, X_test, y_trainval, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    # Then, split trainval into train (60%) and validation (20%)
    X_train, X_val, y_train, y_val = train_test_split(X_trainval, y_trainval, test_size=0.25, random_state=42)
    # 0.25 x 0.8 = 0.2, so you get 60/20/20

    # Train and evaluate each model type
    for model_type in MODELS:
        print(f"\n⚙️ Training {model_type} model for {drug}...")
        
        try:
            # Get model and its hyperparameter search space
            model, search_space = get_model_config(model_type)
            
            # Initialize the optimizer
            opt = BayesSearchCV(
                model,
                search_spaces=search_space,
                n_iter=25,
                scoring=rmse_scorer,
                cv=3,
                random_state=42,
                n_jobs=-1,
                verbose=0
            )
            
            # Train the model
            opt.fit(X_train, y_train)
            best_model = opt.best_estimator_

            # Validation predictions
            val_pred = best_model.predict(X_val)
            rmse_val = rmse(y_val, val_pred)
            mae_val = mean_absolute_error(y_val, val_pred)
            r2_val = r2_score(y_val, val_pred)

            # Test predictions (for final unbiased evaluation)
            test_pred = best_model.predict(X_test)
            rmse_test = rmse(y_test, test_pred)
            mae_test = mean_absolute_error(y_test, test_pred)
            r2_test = r2_score(y_test, test_pred)

            print(f"✅ Best Params: {opt.best_params_}")
            print(f"📊 RMSE: {rmse_val:.2f}, MAE: {mae_val:.2f}, R2: {r2_val:.2f}")
            
            # Feature importance (if available)
            if hasattr(best_model, 'feature_importances_'):
                importance = best_model.feature_importances_
                feature_importance = pd.DataFrame({
                    'Feature': feature_cols,
                    'Importance': importance
                }).sort_values('Importance', ascending=False)
                
                print("Top 5 important features:")
                print(feature_importance.head(5))
            
            # Save the best model
            model_path = os.path.join(MODEL_DIR, f"{model_type.lower()}_model_{drug}_no_weather.pkl")
            joblib.dump(best_model, model_path)
            print(f"📁 Saved: {model_path}")
            
            # After fitting the model and before saving results:
            train_pred = best_model.predict(X_train)

            # Calculate training metrics
            rmse_train = rmse(y_train, train_pred)
            mae_train = mean_absolute_error(y_train, train_pred)
            r2_train = r2_score(y_train, train_pred)
            mape_train = safe_mape(y_train, train_pred) * 100

            # Validation metrics
            mape_val = safe_mape(y_val, val_pred) * 100

            # Test metrics
            mape_test = safe_mape(y_test, test_pred) * 100

            # Save per-sample test predictions for residual analysis (optional)
            test_results = pd.DataFrame({
                'Date': df_model.loc[X_test.index, 'datum'],
                'Drug': drug,
                'Model': model_type,
                'Actual_Sales': y_test,
                'Predicted_Sales': test_pred,
                'Set': 'Test'
            })
            test_results.to_csv(f'residuals/residuals_{drug}_{model_type}_test.csv', index=False)

            # Save per-sample training predictions for residual analysis
            train_results = pd.DataFrame({
                'Date': df_model.loc[X_train.index, 'datum'],
                'Drug': drug,
                'Model': model_type,
                'Actual_Sales': y_train,
                'Predicted_Sales': train_pred,
                'Set': 'Train'
            })
            train_results.to_csv(f'residuals/residuals_{drug}_{model_type}_train.csv', index=False)

            # Save per-sample validation predictions for residual analysis
            val_results = pd.DataFrame({
                'Date': df_model.loc[X_val.index, 'datum'],
                'Drug': drug,
                'Model': model_type,
                'Actual_Sales': y_val,
                'Predicted_Sales': val_pred,
                'Set': 'Validation'
            })
            val_results.to_csv(f'residuals/residuals_{drug}_{model_type}_val.csv', index=False)

            # Store train, validation, and test results
            all_results.append({
                'Drug': drug,
                'Model': model_type,
                'Set': 'Train',
                'RMSE': rmse_train,
                'MAE': mae_train,
                'MAPE': mape_train,
                'R2': r2_train,
                'Samples': X_train.shape[0],
                'Best Params': opt.best_params_
            })
            all_results.append({
                'Drug': drug,
                'Model': model_type,
                'Set': 'Validation',
                'RMSE': rmse_val,
                'MAE': mae_val,
                'MAPE': mape_val,
                'R2': r2_val,
                'Samples': X_val.shape[0],
                'Best Params': opt.best_params_
            })
            all_results.append({
                'Drug': drug,
                'Model': model_type,
                'Set': 'Test',
                'RMSE': rmse_test,
                'MAE': mae_test,
                'MAPE': mape_test,
                'R2': r2_test,
                'Samples': X_test.shape[0],
                'Best Params': opt.best_params_
            })

        except Exception as e:
            print(f"❌ Error training {model_type} model for {drug}: {str(e)}")

# Print summary of results
if all_results:
    results_df = pd.DataFrame(all_results)

    # Print overall summary
    print("\n📋 Summary of All Models:")
    print(results_df[['Drug', 'Model', 'Set', 'RMSE', 'MAE', 'R2']])

    # Print best model for each drug (based on validation RMSE)
    print("\n🏆 Best Model for Each Drug (Validation Set):")
    best_models = results_df[results_df['Set'] == 'Validation'].loc[results_df[results_df['Set'] == 'Validation'].groupby('Drug')['RMSE'].idxmin()]
    print(best_models[['Drug', 'Model', 'RMSE', 'MAE', 'R2']])

    # Save results
    results_df.to_csv('model_comparison_results_no_weather.csv', index=False)
else:
    print("\n❌ No models were successfully trained. Check your data.")



