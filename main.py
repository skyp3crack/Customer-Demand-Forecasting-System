import argparse
import os
from datetime import datetime
from multi_horizon_forecast import MultiHorizonForecast

def main():
    """
    Command-line interface for pharmaceutical drug forecasting system 
    supporting daily, monthly, and yearly forecasts with multiple model types.
    """
    parser = argparse.ArgumentParser(description='Drug Sales Forecasting System')
    
    # Main command argument
    parser.add_argument('command', type=str, choices=['daily', 'monthly', 'yearly', 'all'],
                        help='Type of forecast to generate')
    
    # General options
    parser.add_argument('--data', type=str, default="dataset/salesdaily.csv",
                        help='Path to sales data CSV file')
    parser.add_argument('--weather', type=str, default="dataset/weather/perlis_7day.csv",
                        help='Path to weather data CSV file')
    parser.add_argument('--models', type=str, default="saved_models",
                        help='Directory containing trained models')
    parser.add_argument('--output', type=str, default="forecasts",
                        help='Output directory for forecast files')
    parser.add_argument('--model-type', type=str, choices=['rf', 'knn', 'xgboost'], default='rf',
                        help='Type of model to use for forecasting (rf=Random Forest, knn=K-Nearest Neighbors, xgb=XGBoost)')
    
    # Daily forecast options
    parser.add_argument('--start-date', type=str, 
                        help='Start date for daily forecast (YYYY-MM-DD)')
    parser.add_argument('--days', type=int, default=7,
                        help='Number of days to forecast')
    
    # Monthly forecast options
    parser.add_argument('--start-month', type=str,
                        help='Start month for monthly forecast (YYYY-MM)')
    parser.add_argument('--months', type=int, default=12,
                        help='Number of months to forecast')
    
    # Yearly forecast options
    parser.add_argument('--start-year', type=int,
                        help='Start year for yearly forecast')
    parser.add_argument('--years', type=int, default=3,
                        help='Number of years to forecast')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output, exist_ok=True)
    
    # Set up configuration
    config = {
        'DATA_PATH': args.data,
        'WEATHER_PATH': args.weather,
        'MODEL_DIR': args.models,
        'FORECAST_DAYS': args.days,
        'OUTPUT_PATH': args.output,
        'MODEL_TYPE': args.model_type  # Add model type to configuration
    }
    
    # Initialize forecaster
    forecaster = MultiHorizonForecast(config)
    print(f"Using model type: {args.model_type.upper()}")
    
    # Execute command
    if args.command == 'daily' or args.command == 'all':
        print("\n===== GENERATING DAILY FORECAST =====")
        daily_forecast = forecaster.generate_daily_forecast(args.start_date, args.days)
        if daily_forecast is not None:
            print(f"Daily forecast generated successfully. Preview:")
            print(daily_forecast.head())
    
    if args.command == 'monthly' or args.command == 'all':
        print("\n===== GENERATING MONTHLY FORECAST =====")
        monthly_forecast = forecaster.generate_monthly_forecast(args.start_month, args.months)
        if monthly_forecast is not None:
            print(f"Monthly forecast generated successfully. Preview:")
            print(monthly_forecast.head())
    
    if args.command == 'yearly' or args.command == 'all':
        print("\n===== GENERATING YEARLY FORECAST =====")
        yearly_forecast = forecaster.generate_yearly_forecast(args.start_year, args.years)
        if yearly_forecast is not None:
            print(f"Yearly forecast generated successfully. Preview:")
            print(yearly_forecast)
    
    print(f"\nAll requested forecasts have been saved to: {args.output}/")

if __name__ == "__main__":
    start_time = datetime.now()
    main()
    elapsed = datetime.now() - start_time
    print(f"\nTotal execution time: {elapsed.total_seconds():.2f} seconds")