# 📊 Volatility Level Calculation Explanation

The **Volatility Level** is a risk assessment metric that measures the consistency and predictability of crime patterns over time. Here's how it's calculated:

## Backend Calculation (utils/analysis.py):

```python
# 1. Calculate month-over-month growth rates
monthly_counts['mom_growth'] = monthly_counts['count'].pct_change() * 100

# 2. Calculate volatility as standard deviation of growth rates
'volatility': monthly_counts['mom_growth'].std()
```

**Step-by-step process:**
1. **Monthly Crime Counts**: Group crimes by month to get monthly totals
2. **Month-over-Month Growth**: Calculate percentage change from one month to the next using `pct_change() * 100`
3. **Volatility Measurement**: Compute the **standard deviation** of these growth rates

## Frontend Risk Assessment (DashboardStatistics.jsx):

```javascript
const getVolatilityLevel = () => {
  const volatility = growthRatesData.growth_rates.volatility;
  if (volatility > 50) return { level: "High", color: "red" };
  if (volatility > 25) return { level: "Medium", color: "orange" };
  return { level: "Low", color: "green" };
};
```

## Risk Level Thresholds:

| **Level** | **Threshold** | **Interpretation** | **Color** |
|-----------|---------------|-------------------|-----------|
| **High** | > 50 | Highly unpredictable crime patterns | 🔴 Red |
| **Medium** | 25-50 | Moderately variable patterns | 🟠 Orange |
| **Low** | ≤ 25 | Stable, predictable patterns | 🟢 Green |

## What This Measures:

**Standard Deviation** quantifies how much the month-over-month growth rates vary from their average:

- **Low Volatility (≤25)**: Crime rates are relatively stable month-to-month
- **Medium Volatility (25-50)**: Moderate fluctuations in crime patterns
- **High Volatility (>50)**: Significant month-to-month variations, making predictions difficult

## Practical Implications:

- **High Volatility**: Indicates unpredictable crime patterns that may require more frequent monitoring and flexible resource allocation
- **Low Volatility**: Suggests stable patterns that are easier to forecast and plan for
- **Medium Volatility**: Balanced approach needed between stability and unpredictability

## Example Calculation:

If monthly crime counts are: `[100, 120, 90, 110, 130, 95]`

1. **Growth Rates**: `[+20%, -25%, +22.2%, +18.2%, -26.9%]`
2. **Average Growth**: `1.7%`
3. **Volatility (Std Dev)**: `22.8%` → **Low Risk** (≤25)

This metric helps law enforcement understand whether crime patterns are stable and predictable or highly variable and requiring more dynamic response strategies.