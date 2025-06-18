import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, timedelta, date
import calendar

class MultiHorizonForecast:
    """
    A flexible forecasting module that can generate daily, monthly, and yearly forecasts
    for pharmaceutical drugs.
    """
    
    def __init__(self, config):
        """
        Initialize the forecasting system with configuration parameters.
        
        Args:
            config (dict): Configuration dictionary containing paths and parameters
        """
        self.data_path = config.get('DATA_PATH', "dataset/salesdaily.csv")
        self.weather_path = config.get('WEATHER_PATH', "dataset/weather/perlis_7day.csv")
        self.model_dir = config.get('MODEL_DIR', "saved_models")
        self.forecast_days = config.get('FORECAST_DAYS', 7)
        self.output_path = config.get('OUTPUT_PATH', "forecasts")
        self.drug_columns = config.get('DRUG_COLUMNS', 
                                     ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06'])
        # Set default model type to 'rf' for backward compatibility
        self.model_type = config.get('MODEL_TYPE', 'rf')
        
        # Ensure output directory exists
        os.makedirs(self.output_path, exist_ok=True)
        
        # Initialize data
        self.df = None
        self.weather_df = None
        self.load_data()
        
    def load_data(self):
        """Load and preprocess sales and weather data"""
        print("Loading data...")
        
        # Load sales data
        self.df = pd.read_csv(self.data_path)
        self.df['datum'] = pd.to_datetime(self.df['datum'])
        self.df = self.df.sort_values('datum')
        self.df.rename(columns=lambda x: x.strip().replace(' ', '_'), inplace=True)
        
        # Load weather data
        try:
            self.weather_df = pd.read_csv(self.weather_path)
            self.weather_df.columns = self.weather_df.columns.str.strip().str.replace(" ", "_").str.lower()
            self.weather_df['date'] = pd.to_datetime(self.weather_df['date'])
            
            # Encode weather types
            weather_map = {
                'Clear': 0, 
                'Cloudy': 1, 
                'Rain': 2, 
                'Heavy Rain': 3,
                'Thunderstorm': 4,
                'Hazy': 5,
                'Other': 6
            }
            
            self.weather_df['weather_code'] = self.weather_df['weather_type'].map(weather_map)
            if 'weather_type' in self.weather_df.columns:
                self.weather_df.drop(columns=['weather_type'], inplace=True)
                
            # Add month information for seasonal patterns
            self.weather_df['month'] = self.weather_df['date'].dt.month
            
            # Create monthly averages for filling missing data
            self.monthly_weather_avg = self.weather_df.groupby('month').agg({
                'max_temp': 'mean',
                'min_temp': 'mean',
                'weather_code': lambda x: x.mode().iloc[0] if not x.empty and len(x.mode()) > 0 else 0
            }).reset_index()
            
        except Exception as e:
            print(f"Warning: Could not load weather data: {e}")
            self.weather_df = None
            
        print(f"Data loaded. Historical data range: {self.df['datum'].min().date()} to {self.df['datum'].max().date()}")
    
    def set_model_type(self, model_type):
        """
        Set the type of model to use for forecasting.
        
        Args:
            model_type (str): Type of model ('rf', 'knn', or 'xgboost')
        """
        valid_models = ['rf', 'knn', 'xgboost']
        if model_type not in valid_models:
            print(f"Warning: Invalid model type '{model_type}'. Using 'rf' instead.")
            self.model_type = 'rf'
        else:
            self.model_type = model_type
            print(f"Model type set to: {self.model_type}")
    
    def get_weather_features(self, target_date):
        """
        Get weather features for a specific date, using actual data if available
        or monthly averages if not.
        
        Args:
            target_date: The date to get weather features for
            
        Returns:
            dict: Dictionary of weather features
        """
        if self.weather_df is None:
            return {'max_temp': 30, 'min_temp': 24, 'weather_code': 0}
            
        # Try exact match first
        exact_match = self.weather_df[self.weather_df['date'].dt.date == target_date.date()]
        if not exact_match.empty:
            return exact_match[['max_temp', 'min_temp', 'weather_code']].iloc[0].to_dict()
        
        # Fall back to monthly average
        month = target_date.month
        avg_data = self.monthly_weather_avg[self.monthly_weather_avg['month'] == month]
        if not avg_data.empty:
            return avg_data[['max_temp', 'min_temp', 'weather_code']].iloc[0].to_dict()
        
        # Last resort: return global averages
        return {
            'max_temp': self.weather_df['max_temp'].mean(),
            'min_temp': self.weather_df['min_temp'].mean(),
            'weather_code': self.weather_df['weather_code'].mode()[0] if not self.weather_df['weather_code'].empty else 0
        }
    
    def get_recent_actuals(self, drug_code, days=7):
        """
        Get the most recent actual values for a drug to use as lag features.
        
        Args:
            drug_code (str): The drug code to get values for
            days (int): Number of past days to retrieve
            
        Returns:
            list: List of recent actual values in chronological order
        """
        recent_df = self.df.sort_values('datum', ascending=False).head(days)
        recent_values = recent_df[drug_code].tolist()
        # Reverse to get in chronological order
        return recent_values[::-1]
    
    def prepare_feature_names(self, drug_code):
        """
        Prepare the feature names used during model training.
        
        Args:
            drug_code (str): The drug code to prepare features for
            
        Returns:
            list: List of feature names
        """
        # Create a sample dataframe with the same structure as training
        df_sample = self.df.copy()
        df_sample['Year'] = df_sample['datum'].dt.year
        df_sample['Month'] = df_sample['datum'].dt.month
        df_sample['Hour'] = 0
        df_sample['Is_Weekend'] = df_sample['datum'].dt.dayofweek >= 5
        df_sample['Weekday_Name'] = df_sample['datum'].dt.day_name()
        df_sample = pd.get_dummies(df_sample, columns=['Weekday_Name'])
        
        # Add lag features to get the feature names
        df_drug = df_sample.copy()
        df_drug[f'{drug_code}_lag1'] = df_drug[drug_code].shift(1)
        df_drug[f'{drug_code}_lag2'] = df_drug[drug_code].shift(2)
        df_drug[f'{drug_code}_lag3'] = df_drug[drug_code].shift(3)
        df_drug[f'{drug_code}_lag7'] = df_drug[drug_code].shift(7)
        df_drug[f'{drug_code}_roll3_mean'] = df_drug[drug_code].shift(1).rolling(window=3).mean()
        df_drug[f'{drug_code}_roll7_mean'] = df_drug[drug_code].shift(1).rolling(window=7).mean()
        
        # Define feature columns
        feature_cols = [
            'Year', 'Month', 'Hour', 'Is_Weekend', 'max_temp', 'min_temp', 'weather_code'
        ] + [col for col in df_drug.columns if col.startswith('Weekday_Name_')] + [
            f'{drug_code}_lag1', f'{drug_code}_lag2', f'{drug_code}_lag3', f'{drug_code}_lag7',
            f'{drug_code}_roll3_mean', f'{drug_code}_roll7_mean'
        ]
        
        return feature_cols
    
    def generate_daily_forecast(self, start_date=None, num_days=None):
        """
        Generate daily forecasts for all drugs.
        
        Args:
            start_date (datetime, optional): Start date for forecasting. Defaults to today.
            num_days (int, optional): Number of days to forecast. Defaults to self.forecast_days.
            
        Returns:
            DataFrame: Forecast results in pivoted format (drugs as columns)
        """
        if start_date is None:
            start_date = datetime.now().date()
        elif isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            
        if num_days is None:
            num_days = self.forecast_days
            
        print(f"Generating daily forecast from {start_date} for {num_days} days using {self.model_type.upper()} model...")
        
        # Generate forecast dates
        forecast_dates = pd.date_range(start=start_date, periods=num_days, freq='D')
        
        # Store all forecasts
        forecast_results = []
        
        # Generate forecasts for each drug
        for drug in self.drug_columns:
            drug_forecast = self._forecast_drug_daily(drug, forecast_dates)
            
            # Add all predictions to results
            for day_result in drug_forecast:
                forecast_results.append({
                    'Drug': drug,
                    'Date': day_result['date'],
                    'Predicted_Sales': day_result['prediction']
                })
        
        # Create forecast dataframe
        if forecast_results:
            forecast_df = pd.DataFrame(forecast_results)
            
            # Pivot the dataframe to have drugs as columns
            pivot_df = forecast_df.pivot(index='Date', columns='Drug', values='Predicted_Sales')
            pivot_df.reset_index(inplace=True)
            
            # Save outputs
            forecast_df.to_csv(f"{self.output_path}/daily_forecast_{self.model_type}_{start_date.strftime('%Y%m%d')}.csv", index=False)
            pivot_df.to_csv(f"{self.output_path}/daily_forecast_pivot_{self.model_type}_{start_date.strftime('%Y%m%d')}.csv", index=False)
            
            return pivot_df
        else:
            print("No forecasts were generated!")
            return None
            
    def _forecast_drug_daily(self, drug, forecast_dates):
        """
        Generate daily forecasts for a specific drug.
        
        Args:
            drug (str): Drug code to forecast
            forecast_dates (DatetimeIndex): Dates to forecast for
            
        Returns:
            list: List of dictionaries with forecast results
        """
        # Get the model path based on the selected model type
        model_path = os.path.join(self.model_dir, f"{self.model_type}_model_{drug}.pkl")
        
        if not os.path.exists(model_path):
            print(f"⚠️ Model for {drug} ({self.model_type}) not found at {model_path}. Skipping.")
            return []
            
        try:
            # Load the model
            model = joblib.load(model_path)
            
            # Get feature names
            feature_cols = self.prepare_feature_names(drug)
            
            # Verify model feature names if available
            if hasattr(model, 'feature_names_in_'):
                feature_cols = model.feature_names_in_.tolist()
            
            # Calculate baseline values for initialization
            last_year_data = self.df[self.df['datum'] >= (self.df['datum'].max() - pd.Timedelta(days=365))]
            if len(last_year_data) < 30:
                last_year_data = self.df
            
            # Historical averages to use as baselines
            avg_sales = last_year_data[drug].mean()
            avg_sales_by_month = last_year_data.groupby(last_year_data['datum'].dt.month)[drug].mean()
            avg_sales_by_weekday = last_year_data.groupby(last_year_data['datum'].dt.dayofweek)[drug].mean()
            
            # Get most recent actual values to use as initialization
            recent_actuals = self.get_recent_actuals(drug)
            recent_actual_mean3 = np.mean(recent_actuals[-3:]) if len(recent_actuals) >= 3 else avg_sales
            recent_actual_mean7 = np.mean(recent_actuals) if len(recent_actuals) > 0 else avg_sales
            
            # Create forecast for each day
            drug_forecast = []
            
            for i, forecast_date in enumerate(forecast_dates):
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
                
                # Add weather data
                weather_features = self.get_weather_features(forecast_date)
                forecast_row.update(weather_features)
                
                # Initialize lag features - complex logic to handle different periods
                if i == 0:
                    # First forecast day - use actual recent values if available
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
                
            return drug_forecast
            
        except Exception as e:
            print(f"❌ Error processing {drug}: {str(e)}")
            return []
    
    def generate_monthly_forecast(self, start_month=None, num_months=12):
        """
        Generate monthly forecasts by aggregating daily forecasts.
        
        Args:
            start_month (str): Month to start forecasting in 'YYYY-MM' format
            num_months (int): Number of months to forecast
            
        Returns:
            DataFrame: Monthly forecasts
        """
        if start_month is None:
            today = datetime.now()
            # If we're past the 15th of the month, start with next month
            if today.day > 15:
                if today.month == 12:
                    start_month = f"{today.year + 1}-01"
                else:
                    start_month = f"{today.year}-{today.month + 1:02d}"
            else:
                start_month = f"{today.year}-{today.month:02d}"
        
        print(f"Generating monthly forecast starting from {start_month} for {num_months} months using {self.model_type.upper()} model...")
        
        # Parse start month
        year, month = map(int, start_month.split('-'))
        start_date = date(year, month, 1)
        
        monthly_forecasts = []
        
        # For each month in the forecast period
        for i in range(num_months):
            # Calculate current month and year
            current_month = ((month - 1 + i) % 12) + 1
            current_year = year + ((month - 1 + i) // 12)
            
            # Calculate the number of days in this month
            days_in_month = calendar.monthrange(current_year, current_month)[1]
            
            # Generate daily forecasts for the entire month
            month_start = date(current_year, current_month, 1)
            daily_forecast = self.generate_daily_forecast(month_start, days_in_month)
            
            if daily_forecast is not None:
                # Calculate monthly totals
                monthly_totals = daily_forecast.iloc[:, 1:].sum()
                
                # Create a row for this month
                month_data = {
                    'Year': current_year,
                    'Month': current_month,
                    'Month_Label': month_start.strftime('%Y-%m')
                }
                
                # Add drug totals
                for drug in self.drug_columns:
                    if drug in monthly_totals.index:
                        month_data[drug] = monthly_totals[drug]
                    else:
                        month_data[drug] = 0
                
                monthly_forecasts.append(month_data)
        
        # Create monthly forecast dataframe
        if monthly_forecasts:
            monthly_df = pd.DataFrame(monthly_forecasts)
            
            # Save output
            monthly_df.to_csv(f"{self.output_path}/monthly_forecast_{self.model_type}_{start_month.replace('-', '')}.csv", index=False)
            
            return monthly_df
        else:
            print("No monthly forecasts were generated!")
            return None
    
    def generate_yearly_forecast(self, start_year=None, num_years=3):
        """
        Generate yearly forecasts by aggregating monthly forecasts.
        
        Args:
            start_year (int): Year to start forecasting 
            num_years (int): Number of years to forecast
            
        Returns:
            DataFrame: Yearly forecasts
        """
        if start_year is None:
            today = datetime.now()
            # If we're in the last quarter, start with next year
            if today.month >= 10:
                start_year = today.year + 1
            else:
                start_year = today.year
        
        print(f"Generating yearly forecast starting from {start_year} for {num_years} years using {self.model_type.upper()} model...")
        
        yearly_forecasts = []
        
        # Generate monthly forecasts for all months in the forecast period
        start_month = f"{start_year}-01"
        num_months = num_years * 12
        monthly_df = self.generate_monthly_forecast(start_month, num_months)
        
        if monthly_df is not None:
            # Group by year and sum
            yearly_df = monthly_df.groupby('Year')[self.drug_columns].sum().reset_index()
            
            # Save output
            yearly_df.to_csv(f"{self.output_path}/yearly_forecast_{self.model_type}_{start_year}.csv", index=False)
            
            return yearly_df
        else:
            print("No yearly forecasts were generated!")
            return None