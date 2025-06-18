import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load forecasted sales
forecast_df = pd.read_csv('C:/Users/user/Desktop/Unimap/fyp2/drug_forecasts.csv')
forecast_df['Date'] = pd.to_datetime(forecast_df['Date']).dt.date

# Load actual sales data
actual_df = pd.read_csv('C:/Users/user/Desktop/Unimap/fyp2/dataset/salesdaily.csv')

# Fix date format from DD/MM/YYYY to date object
actual_df['Date'] = pd.to_datetime(actual_df['datum'], dayfirst=True, format='mixed').dt.date

# Define drug columns
drug_columns = ['M01AB', 'M01AE', 'N02BA', 'N02BE', 'N05B', 'N05C', 'R03', 'R06']

# Reshape actual data into long format
actual_long = actual_df.melt(id_vars=['Date'], value_vars=drug_columns,
                             var_name='Drug', value_name='Actual_Sales')

# Merge forecast and actuals on Date and Drug
combined = pd.merge(forecast_df, actual_long, on=['Date', 'Drug'])

# Check merged data
print("Combined Preview:")
print(combined.head())
print(f"Total rows: {len(combined)}")

# Plotting
plt.figure(figsize=(12, 6))
sns.set(style="whitegrid")

for drug in combined['Drug'].unique():
    drug_data = combined[combined['Drug'] == drug]
    plt.plot(drug_data['Date'], drug_data['Actual_Sales'], marker='o', label=f'{drug} Actual')
    plt.plot(drug_data['Date'], drug_data['Predicted_Sales'], marker='x', linestyle='--', label=f'{drug} Predicted')
    

from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

mae = mean_absolute_error(combined['Actual_Sales'], combined['Predicted_Sales'])
rmse = np.sqrt(mean_squared_error(combined['Actual_Sales'], combined['Predicted_Sales']))
print(f"MAE: {mae:.2f}")
print(f"RMSE: {rmse:.2f}")


# Avoid divide-by-zero in MAPE
non_zero_actuals = combined[combined['Actual_Sales'] != 0]
mape = np.mean(np.abs((non_zero_actuals['Actual_Sales'] - non_zero_actuals['Predicted_Sales']) / non_zero_actuals['Actual_Sales'])) * 100
print(f"MAPE: {mape:.2f}%")


plt.title("Actual vs Predicted Drug Sales")
plt.xlabel("Date")
plt.ylabel("Sales")
plt.xticks(rotation=45)
plt.legend()
plt.tight_layout()
plt.show()



