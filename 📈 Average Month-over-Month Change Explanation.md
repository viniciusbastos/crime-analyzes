# 📈 Average Month-over-Month Change Explanation

The **Average Month-over-Month (MoM) Change** measures the **typical growth rate** of crime incidents from one month to the next.

## How It's Calculated:

```python
# 1. Calculate individual month-over-month changes
monthly_counts['mom_growth'] = monthly_counts['count'].pct_change() * 100

# 2. Average all the month-over-month changes
average_mom_growth = monthly_counts['mom_growth'].mean()
```

## What It Measures:

**Month-over-Month Change** = `((Current Month - Previous Month) / Previous Month) × 100`

## Example Calculation:

| **Month** | **Crimes** | **MoM Change** |
|-----------|------------|----------------|
| January | 100 | - |
| February | 120 | **+20%** |
| March | 90 | **-25%** |
| April | 108 | **+20%** |
| May | 140 | **+29.6%** |

**Average MoM Change** = `(20% + (-25%) + 20% + 29.6%) ÷ 4` = **+11.15%**

## Interpretation Guide:

| **Average MoM Change** | **Interpretation** | **Trend Direction** |
|----------------------|-------------------|-------------------|
| **> +15%** | **Rapid Increase** | 🔴 Strong upward trend |
| **+5% to +15%** | **Moderate Increase** | 🟠 Growing trend |
| **-5% to +5%** | **Stable** | 🟢 Stable pattern |
| **-5% to -15%** | **Moderate Decrease** | 🔵 Declining trend |
| **< -15%** | **Rapid Decrease** | 🔵 Strong downward trend |

## Real-World Meaning:

- **+11.15%**: Crime rates are growing by an average of **11.15% each month**
- **Positive values**: Crime rates are **increasing over time**
- **Negative values**: Crime rates are **decreasing over time**
- **Zero**: Crime rates are **stable** (no net change)

## Practical Applications:

1. **Trend Identification**: Shows whether crime is generally increasing or decreasing
2. **Resource Planning**: Helps predict future crime rates for staffing decisions
3. **Policy Evaluation**: Measures effectiveness of crime prevention programs
4. **Comparative Analysis**: Compare crime trends across different areas or time periods

## Combined with Volatility:

- **High Average + High Volatility**: Rapid growth with unpredictable swings
- **High Average + Low Volatility**: Steady, consistent growth
- **Low Average + High Volatility**: Stable overall but very unpredictable month-to-month
- **Low Average + Low Volatility**: Very stable, predictable patterns

## Example Insights:

- **+25% Average MoM**: Crime rates double every ~3 months
- **-10% Average MoM**: Crime rates decrease by 10% monthly
- **+2% Average MoM**: Slow but steady increase over time

This metric provides a **clear, quantitative measure** of whether crime rates are trending up, down, or staying stable over time.