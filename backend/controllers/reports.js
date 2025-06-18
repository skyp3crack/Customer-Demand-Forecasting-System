const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { SalesData, ForecastData, ActivityLog } = require('../models');

const getReportData = async (req, res) => {
  try {
    const { type, startDate, endDate, drugs } = req.query;

    // Validate required parameters
    if (!type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: type, startDate, and endDate are required'
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    let data = [];

    switch (type) {
      case 'performance':
        // Performance Overview - Compare actual sales with predicted sales
        data = await sequelize.query(`
          SELECT 
            DATE(s.date) as date,
            SUM(s.actual_sales) as actual,
            COALESCE(SUM(f.predicted_sales), 0) as predicted,
            CASE 
              WHEN SUM(s.actual_sales) > 0 
              THEN ROUND((1 - ABS(SUM(s.actual_sales) - COALESCE(SUM(f.predicted_sales), 0)) / SUM(s.actual_sales)) * 100, 2)
              ELSE 0 
            END as accuracy
          FROM salesData s
          LEFT JOIN forecastData f ON DATE(s.date) = DATE(f.date) AND s.drug = f.drug
          WHERE DATE(s.date) BETWEEN :startDate AND :endDate
          ${drugs && drugs.length ? 'AND s.drug IN (:drugs)' : ''}
          GROUP BY DATE(s.date)
          ORDER BY DATE(s.date)
        `, {
          replacements: {
            startDate,
            endDate,
            drugs: drugs || []
          },
          type: sequelize.QueryTypes.SELECT
        });
        break;

      case 'drug-analysis':
        // Drug Analysis - Sales, growth, and market share
        data = await sequelize.query(`
          WITH monthly_sales AS (
            SELECT 
              drug,
              DATE_TRUNC('month', date) as month,
              SUM(actual_sales) as monthly_sales
            FROM salesData
            WHERE date BETWEEN :startDate AND :endDate
            ${drugs && drugs.length ? 'AND drug IN (:drugs)' : ''}
            GROUP BY drug, DATE_TRUNC('month', date)
          )
          SELECT 
            drug,
            SUM(monthly_sales) as sales,
            ROUND(
              (MAX(monthly_sales) - MIN(monthly_sales)) / MIN(monthly_sales) * 100,
              2
            ) as growth,
            ROUND(
              SUM(monthly_sales) * 100.0 / SUM(SUM(monthly_sales)) OVER (),
              2
            ) as marketShare
          FROM monthly_sales
          GROUP BY drug
          ORDER BY sales DESC
        `, {
          replacements: {
            startDate,
            endDate,
            drugs: drugs || []
          },
          type: sequelize.QueryTypes.SELECT
        });
        break;

      case 'user-activity':
        // User Activity - Using ActivityLog model
        data = await ActivityLog.findAll({
          attributes: [
            'activity',
            'details',
            'createdAt',
            'ip_address',
            'user_agent'
          ],
          where: {
            createdAt: {
              [Op.between]: [start, end]
            }
          },
          order: [['createdAt', 'DESC']],
          raw: true
        }).then(logs => logs.map(log => ({
          date: log.createdAt,
          activity: log.activity,
          details: log.details,
          ip: log.ip_address,
          userAgent: log.user_agent
        })));
        break;

      case 'system-usage':
        // System Usage - Aggregate metrics from sales and forecasts
        data = await sequelize.query(`
          WITH daily_metrics AS (
            SELECT 
              DATE(s.date) as date,
              COUNT(DISTINCT s.drug) as unique_drugs,
              SUM(s.actual_sales) as total_sales,
              COUNT(DISTINCT f.drug) as drugs_with_forecast,
              AVG(ABS(s.actual_sales - COALESCE(f.predicted_sales, 0))) as avg_prediction_error
            FROM salesData s
            LEFT JOIN forecastData f ON DATE(s.date) = DATE(f.date) AND s.drug = f.drug
            WHERE DATE(s.date) BETWEEN :startDate AND :endDate
            GROUP BY DATE(s.date)
          )
          SELECT 
            date,
            'Unique Drugs' as metric,
            unique_drugs as value,
            ROUND(
              (unique_drugs - LAG(unique_drugs) OVER (ORDER BY date)) * 100.0 / 
              NULLIF(LAG(unique_drugs) OVER (ORDER BY date), 0),
              2
            ) as change
          FROM daily_metrics
          UNION ALL
          SELECT 
            date,
            'Total Sales' as metric,
            total_sales as value,
            ROUND(
              (total_sales - LAG(total_sales) OVER (ORDER BY date)) * 100.0 / 
              NULLIF(LAG(total_sales) OVER (ORDER BY date), 0),
              2
            ) as change
          FROM daily_metrics
          UNION ALL
          SELECT 
            date,
            'Forecast Coverage' as metric,
            ROUND(drugs_with_forecast * 100.0 / NULLIF(unique_drugs, 0), 2) as value,
            ROUND(
              (drugs_with_forecast * 100.0 / NULLIF(unique_drugs, 0) - 
               LAG(drugs_with_forecast * 100.0 / NULLIF(unique_drugs, 0)) OVER (ORDER BY date)),
              2
            ) as change
          FROM daily_metrics
          ORDER BY date DESC, metric
        `, {
          replacements: {
            startDate,
            endDate
          },
          type: sequelize.QueryTypes.SELECT
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Must be one of: performance, drug-analysis, user-activity, system-usage'
        });
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDrugPerformanceReport = async (req, res) => {
  try {
    const { drugIds, startDate, endDate, timePeriod = 'daily' } = req.body;

    // Validate required parameters
    if (!drugIds || !drugIds.length || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: drugIds, startDate, and endDate are required'
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Get sales data for all selected drugs
    const salesData = [];
    for (const drugId of drugIds) {
      const drugSales = await sequelize.query(`
        SELECT 
          ${timePeriod === 'monthly' ? 
            'DATE_FORMAT(date, \'%Y-%m\') as period' : 
            'DATE(date) as period'},
          drug,
          SUM(actual_sales) as total_sales
        FROM salesData
        WHERE drug = :drugId
          AND date BETWEEN :startDate AND :endDate
        GROUP BY ${timePeriod === 'monthly' ? 'YEAR(date), MONTH(date)' : 'DATE(date)'}, drug
        ORDER BY period
      `, {
        replacements: { drugId, startDate, endDate },
        type: sequelize.QueryTypes.SELECT
      });
      salesData.push(...drugSales);
    }

    // Transform data for chart
    const transformedData = [];
    const periods = [...new Set(salesData.map(item => item.period))].sort();
    
    // Group by period
    periods.forEach(period => {
      const periodData = { period };
      const periodSales = salesData.filter(item => item.period === period);
      
      periodSales.forEach(sale => {
        periodData[sale.drug] = parseFloat(sale.total_sales);
      });
      
      transformedData.push(periodData);
    });

    // Calculate KPIs
    const kpis = {};
    drugIds.forEach(drugId => {
      const drugSales = salesData.filter(item => item.drug === drugId);
      const salesValues = drugSales.map(item => parseFloat(item.total_sales));
      const totalSales = salesValues.reduce((sum, val) => sum + val, 0);
      
      // Calculate growth rate if we have at least 2 periods
      let growthRate = 0;
      if (salesValues.length >= 2) {
        const firstPeriod = salesValues[0] || 0;
        const lastPeriod = salesValues[salesValues.length - 1] || 0;
        growthRate = firstPeriod !== 0 ? 
          ((lastPeriod - firstPeriod) / firstPeriod) * 100 : 0;
      }
      
      kpis[drugId] = {
        totalSales,
        growthRate: parseFloat(growthRate.toFixed(2)),
        averageSales: parseFloat((totalSales / (salesValues.length || 1)).toFixed(2))
      };
    });

    res.json({
      success: true,
      data: transformedData,
      kpis,
      meta: {
        totalRecords: transformedData.length,
        startDate,
        endDate,
        drugIds,
        timePeriod
      }
    });

  } catch (error) {
    console.error('Error in getDrugPerformanceReport:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate drug performance report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getReportData,
  getDrugPerformanceReport
};
