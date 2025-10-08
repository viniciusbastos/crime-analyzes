from typing import Dict, Any


class MockResponseBuilder:
    """Builds mock responses for different query types"""

    def generate_mock_response(self, user_query: str, data_context: Dict[str, Any]) -> str:
        """Generate intelligent mock responses based on query analysis"""
        user_query_lower = user_query.lower()
        total_crimes = data_context.get('total_crimes', 0)
        crime_types = data_context.get('crime_types', [])
        temporal_patterns = data_context.get('temporal_patterns', {})
        weekday_weekend = data_context.get('weekday_weekend', {})

        # Advanced query pattern matching
        query_patterns = {
            # Trend and overview queries
            ('trend', 'overall', 'summary', 'statistics'): self._trend_analysis_response,
            ('change', 'growth', 'increase', 'decrease', 'rate'): self._growth_rate_response,

            # Temporal queries
            ('when', 'time', 'hour', 'schedule'): self._temporal_analysis_response,
            ('daily', 'day-to-day', 'short-term', 'recent days'): self._daily_analysis_response,
            ('weekly', 'week-to-week', 'medium-term', 'recent weeks'): self._weekly_analysis_response,
            ('weekend', 'weekday', 'week'): self._weekday_weekend_response,
            ('month', 'season', 'seasonal', 'quarter'): self._monthly_seasonal_response,

            # Crime type queries
            ('type', 'category', 'common', 'frequent'): self._crime_type_response,
            ('theft', 'burglary', 'assault', 'robbery', 'vehicle'): self._crime_type_response,

            # Location and geographic queries
            ('where', 'location', 'area', 'neighborhood', 'district'): self._location_analysis_response,
            ('hotspot', 'cluster', 'concentration'): self._hotspot_analysis_response,

            # Predictive and forecasting queries
            ('predict', 'forecast', 'next', 'future', 'expect'): self._prediction_response,
            ('risk', 'danger', 'safe', 'prevention'): self._risk_assessment_response,

            # Resource and strategy queries
            ('police', 'patrol', 'resource', 'allocation'): self._resource_allocation_response,
            ('strategy', 'plan', 'recommend', 'improve'): self._strategy_recommendations_response,

            # Comparative queries
            ('compare', 'versus', 'vs', 'difference'): self._comparative_analysis_response,
            ('best', 'worst', 'highest', 'lowest'): self._extremes_analysis_response,

            # Impact and correlation queries
            ('affect', 'impact', 'cause', 'correlation', 'relationship'): self._correlation_analysis_response,
            ('weather', 'economic', 'social', 'factor'): self._external_factors_response,

            # Data collection and improvement queries
            ('improve', 'data collection', 'limitation', 'enhancement', 'granularity'): self._data_collection_improvement_response,
        }

        # Check for matching patterns
        for patterns, response_func in query_patterns.items():
            if any(pattern in user_query_lower for pattern in patterns):
                return response_func(data_context, user_query_lower)

        # Fallback for unmatched queries
        return self._general_help_response(data_context)

    def _trend_analysis_response(self, data_context, query):
        """Comprehensive trend analysis response"""
        total_crimes = data_context.get('total_crimes', 0)
        yearly_data = data_context.get('temporal_patterns', {}).get('yearly', [])

        return f"""📈 **Comprehensive Crime Trend Analysis**

**Dataset Overview:**
- **Total Incidents**: {total_crimes:,} crimes analyzed
- **Analysis Period**: {data_context.get('date_range', {}).get('start', 'N/A')} to {data_context.get('date_range', {}).get('end', 'Present')}
- **Crime Categories**: {len(data_context.get('crime_types', []))} types identified

**Year-over-Year Trends:**
{chr(10).join([f"- **{year['year']}**: {year['count']:,} incidents" for year in yearly_data])}

**Key Crime Categories (Top 5):**
{chr(10).join([f"- **{crime['type']}**: {crime['count']:,} ({crime['percentage']}%)" for crime in data_context.get('crime_types', [])[:5]])}

**Temporal Distribution:**
- **Weekday Incidents**: {data_context.get('weekday_weekend', {}).get('weekdays', 0):,}
- **Weekend Incidents**: {data_context.get('weekday_weekend', {}).get('weekends', 0):,}
- **Peak Hours**: Evening hours (6 PM - 2 AM) show highest activity

**Strategic Insights:**
- Focus prevention efforts on top crime categories
- Implement targeted patrols during peak hours
- Develop community programs for high-risk periods
- Monitor emerging trends for early intervention"""

    def _growth_rate_response(self, data_context, query):
        """Growth rate and change analysis"""
        yearly_data = data_context.get('temporal_patterns', {}).get('yearly', [])

        if len(yearly_data) >= 2:
            # Calculate year-over-year changes
            changes = []
            for i in range(1, len(yearly_data)):
                prev_year = yearly_data[i-1]
                curr_year = yearly_data[i]
                change = ((curr_year['count'] - prev_year['count']) / prev_year['count']) * 100
                changes.append({
                    'year': curr_year['year'],
                    'change': change,
                    'direction': 'increase' if change > 0 else 'decrease'
                })

            return f"""📊 **Crime Growth Rate Analysis**

**Year-over-Year Changes:**
{chr(10).join([f"- **{change['year']}**: {change['change']:+.1f}% {change['direction']} from previous year" for change in changes])}

**Trend Interpretation:**
- **Overall Direction**: {'Increasing' if sum(c['change'] for c in changes) > 0 else 'Decreasing'} trend
- **Volatility**: {len([c for c in changes if abs(c['change']) > 10]):} years with significant changes (>10%)
- **Stability**: {len([c for c in changes if abs(c['change']) <= 5]):} years of relative stability

**Key Insights:**
- Monitor periods of significant change for contributing factors
- Focus on sustainable prevention strategies during growth periods
- Evaluate successful interventions during decline periods"""

        return "Insufficient historical data for growth rate analysis. Need at least 2 years of data."

    def _temporal_analysis_response(self, data_context, query):
        """Detailed temporal pattern analysis"""
        hourly_data = data_context.get('temporal_patterns', {}).get('hourly', [])
        monthly_data = data_context.get('temporal_patterns', {}).get('monthly', [])

        # Find peak hours
        peak_hour = max(hourly_data, key=lambda x: x['count']) if hourly_data else {'hour': 0, 'count': 0}
        peak_month = max(monthly_data, key=lambda x: x['count']) if monthly_data else {'month': 0, 'count': 0}

        return f"""🕐 **Detailed Temporal Crime Analysis**

**Hourly Patterns:**
- **Peak Hour**: {peak_hour['hour']:02d}:00 with {peak_hour['count']} incidents
- **Quietest Hours**: Early morning (2 AM - 6 AM)
- **High-Risk Periods**: Evening and night hours

**Top Crime Hours:**
{chr(10).join([f"- **{hour['hour']:02d}:00**: {hour['count']} incidents" for hour in sorted(hourly_data, key=lambda x: x['count'], reverse=True)[:5]])}

**Monthly Distribution:**
- **Busiest Month**: Month {peak_month['month']} with {peak_month['count']} incidents
- **Seasonal Variation**: ~25% difference between peak and low months

**Weekly Patterns:**
- **Weekdays**: {data_context.get('weekday_weekend', {}).get('weekdays', 0):,} incidents
- **Weekends**: {data_context.get('weekday_weekend', {}).get('weekends', 0):,} incidents
- **Weekend Premium**: {((data_context.get('weekday_weekend', {}).get('weekends', 0) / max(data_context.get('weekday_weekend', {}).get('weekdays', 0), 1)) * 100 - 100):.1f}% higher per day

**Operational Recommendations:**
- Schedule additional patrols during peak evening hours
- Focus weekend resources on entertainment districts
- Monitor seasonal patterns for resource planning"""

    def _daily_analysis_response(self, data_context, query):
        """Detailed daily crime pattern analysis"""
        daily_data = data_context.get('temporal_patterns', {}).get('daily', [])

        if not daily_data:
            return "Insufficient daily data for analysis. Need data at daily granularity for short-term pattern identification."

        # Calculate daily statistics
        daily_counts = [d['count'] for d in daily_data]
        avg_daily = sum(daily_counts) / len(daily_counts) if daily_counts else 0
        max_day = max(daily_data, key=lambda x: x['count']) if daily_data else {'date': 'N/A', 'count': 0}
        min_day = min(daily_data, key=lambda x: x['count']) if daily_data else {'date': 'N/A', 'count': 0}

        # Calculate daily variation
        daily_variation = (max_day['count'] - min_day['count']) / max(avg_daily, 1) * 100

        # Identify recent trends
        recent_trend = "stable"
        if len(daily_data) >= 7:
            recent_avg = sum(d['count'] for d in daily_data[:7]) / 7
            older_avg = sum(d['count'] for d in daily_data[7:14]) / min(7, len(daily_data) - 7)
            trend_change = (recent_avg - older_avg) / max(older_avg, 1) * 100
            if trend_change > 10:
                recent_trend = f"increasing ({trend_change:+.1f}%)"
            elif trend_change < -10:
                recent_trend = f"decreasing ({trend_change:+.1f}%)"

        volatility = 'High' if daily_variation > 50 else 'Moderate' if daily_variation > 25 else 'Low'
        top_days = chr(10).join([f"- **{day['date']}**: {day['count']} incidents"
                                for day in sorted(daily_data[:10], key=lambda x: x['count'], reverse=True)[:5]])

        return f"""📅 **Daily Crime Pattern Analysis**

**Recent Daily Activity ({len(daily_data)} days analyzed):**
- **Average Daily Crimes**: {avg_daily:.1f} incidents per day
- **Peak Day**: {max_day['date']} ({max_day['count']} incidents)
- **Lowest Day**: {min_day['date']} ({min_day['count']} incidents)
- **Daily Variation**: {daily_variation:.1f}% difference from average

**Recent Trend Analysis:**
- **7-Day Trend**: {recent_trend}
- **Volatility**: {volatility} daily fluctuation

**Top Recent Days:**
{top_days}

**Short-Term Insights:**
- Day-to-day variability suggests predictable crime patterns
- Recent trend indicates stable crime environment

**Operational Recommendations:**
- **Daily Monitoring**: Track patterns for early spike detection
- **Reactive Deployment**: Adjust patrol strength based on forecasts
- **Event Correlation**: Link spikes to local events or conditions
- **Resource Planning**: Use patterns for next-day allocation

**Data Enhancement Needed:**
- Daily collection enables real-time trend monitoring
- Event correlation requires activity data integration"""

    def _weekly_analysis_response(self, data_context, query):
        """Detailed weekly crime pattern analysis"""
        weekly_data = data_context.get('temporal_patterns', {}).get('weekly', [])

        if not weekly_data:
            return "Insufficient weekly data for analysis. Need data aggregated by week for medium-term pattern identification."

        # Calculate weekly statistics
        weekly_counts = [w['count'] for w in weekly_data]
        avg_weekly = sum(weekly_counts) / len(weekly_counts) if weekly_counts else 0
        max_week = max(weekly_data, key=lambda x: x['count']) if weekly_data else {'year': 0, 'week': 0, 'count': 0}
        min_week = min(weekly_data, key=lambda x: x['count']) if weekly_data else {'year': 0, 'week': 0, 'count': 0}

        # Calculate weekly variation
        weekly_variation = (max_week['count'] - min_week['count']) / max(avg_weekly, 1) * 100

        # Identify recent trends
        recent_trend = "stable"
        if len(weekly_data) >= 8:
            recent_avg = sum(w['count'] for w in weekly_data[:4]) / 4
            older_avg = sum(w['count'] for w in weekly_data[4:8]) / 4
            trend_change = (recent_avg - older_avg) / max(older_avg, 1) * 100
            if trend_change > 15:
                recent_trend = f"increasing ({trend_change:+.1f}%)"
            elif trend_change < -15:
                recent_trend = f"decreasing ({trend_change:+.1f}%)"

        volatility = 'High' if weekly_variation > 40 else 'Moderate' if weekly_variation > 20 else 'Low'
        top_weeks = chr(10).join([f"- **Week {week['week']}/{week['year']}**: {week['count']} incidents"
                                 for week in sorted(weekly_data[:12], key=lambda x: x['count'], reverse=True)[:5]])

        return f"""📊 **Weekly Crime Pattern Analysis**

**Weekly Activity Summary ({len(weekly_data)} weeks analyzed):**
- **Average Weekly Crimes**: {avg_weekly:.1f} incidents per week
- **Peak Week**: Week {max_week['week']}/{max_week['year']} ({max_week['count']} incidents)
- **Lowest Week**: Week {min_week['week']}/{min_week['year']} ({min_week['count']} incidents)
- **Weekly Variation**: {weekly_variation:.1f}% difference from average

**Medium-Term Trend Analysis:**
- **4-Week Trend**: {recent_trend}
- **Volatility**: {volatility} weekly fluctuation

**Recent High Activity Weeks:**
{top_weeks}

**Weekly Pattern Insights:**
- Week-to-week variability suggests predictable medium-term cycles
- Recent trend shows stable crime levels

**Strategic Recommendations:**
- **Weekly Planning**: Use patterns for resource scheduling
- **Trend Monitoring**: Track 4-week moving averages for early warnings
- **Seasonal Preparation**: Identify recurring weekly patterns
- **Intervention Timing**: Target high-activity weeks with prevention programs

**Enhanced Analytics Opportunities:**
- Weekly data enables medium-term forecasting
- Correlation with seasonal events and holidays
- Resource optimization based on weekly cycles
- Early warning system for crime wave detection"""

    def _crime_type_response(self, data_context, query):
        """Comprehensive crime type analysis"""
        crime_types = data_context.get('crime_types', [])

        if not crime_types:
            return "No crime type data available for analysis."

        # Calculate concentration metrics
        top_3_percentage = sum(crime['percentage'] for crime in crime_types[:3])
        gini_coefficient = self._calculate_crime_concentration(crime_types)

        return f"""📊 **Crime Type Distribution Analysis**

**Top Crime Categories:**
{chr(10).join([f"1. **{crime['type']}** - {crime['count']:,} incidents ({crime['percentage']}%)" for crime in crime_types[:5]])}

**Concentration Analysis:**
- **Top 3 Categories**: Account for {top_3_percentage:.1f}% of all crimes
- **Distribution Inequality**: {'High' if gini_coefficient > 0.7 else 'Moderate' if gini_coefficient > 0.5 else 'Low'} concentration
- **Specialization Index**: {len([c for c in crime_types if c['percentage'] > 10]):} major crime categories

**Crime Type Insights:**
{chr(10).join([f"- **{crime['type']}**: Focus on {'commercial areas' if 'theft' in crime['type'].lower() else 'residential zones' if 'burglary' in crime['type'].lower() else 'public spaces' if 'assault' in crime['type'].lower() else 'targeted locations'}" for crime in crime_types[:3]])}

**Strategic Recommendations:**
- Develop specialized units for top crime categories
- Implement category-specific prevention programs
- Focus investigative resources on high-volume types
- Monitor emerging crime types for early intervention"""

    def _prediction_response(self, data_context, query):
        """Advanced predictive analysis"""
        total_crimes = data_context.get('total_crimes', 0)
        monthly_data = data_context.get('temporal_patterns', {}).get('monthly', [])
        yearly_data = data_context.get('temporal_patterns', {}).get('yearly', [])

        # Simple forecasting based on trends
        if yearly_data:
            recent_years = sorted(yearly_data, key=lambda x: x['year'], reverse=True)[:3]
            avg_growth = sum(
                ((recent_years[i]['count'] - recent_years[i+1]['count']) / recent_years[i+1]['count'] * 100)
                for i in range(len(recent_years)-1)
            ) / max(len(recent_years)-1, 1)

            predicted_next_year = int(recent_years[0]['count'] * (1 + avg_growth/100))

        return f"""🔮 **Advanced Crime Prediction & Forecasting**

**Next Year Forecast:**
- **Predicted Volume**: {predicted_next_year if 'predicted_next_year' in locals() else int(total_crimes * 1.05):,} incidents
- **Growth Rate**: {avg_growth if 'avg_growth' in locals() else 5:.1f}% based on recent trends
- **Confidence Level**: 75% (based on historical patterns)

**Seasonal Predictions:**
{chr(10).join([f"- **Month {month['month']}**: {int(month['count'] * 1.05)} incidents (projected)" for month in monthly_data[:6]])}

**Risk Factor Analysis:**
- **High-Risk Periods**: Holiday seasons and summer months
- **Weather Impact**: Potential increase during adverse weather
- **Economic Factors**: Monitor unemployment and economic indicators
- **Social Events**: Large gatherings may increase certain crime types

**Crime Type Projections:**
{chr(10).join([f"- **{crime['type']}**: {int(crime['count'] * 1.05)} - {int(crime['count'] * 1.15)} cases" for crime in data_context.get('crime_types', [])[:3]])}

**Prevention Strategies:**
1. **Proactive Patrols**: Increase presence during predicted high-risk periods
2. **Community Programs**: Focus on at-risk areas identified by trends
3. **Resource Allocation**: Adjust staffing based on seasonal patterns
4. **Early Warning**: Monitor leading indicators for trend changes"""

    def _resource_allocation_response(self, data_context, query):
        """Resource allocation and deployment recommendations"""
        total_crimes = data_context.get('total_crimes', 0)
        hourly_data = data_context.get('temporal_patterns', {}).get('hourly', [])
        weekday_weekend = data_context.get('weekday_weekend', {})

        # Calculate optimal resource distribution
        peak_hours = sorted(hourly_data, key=lambda x: x['count'], reverse=True)[:4]
        weekday_crimes = weekday_weekend.get('weekdays', 0)
        weekend_crimes = weekday_weekend.get('weekends', 0)

        return f"""👮 **Optimal Resource Allocation Strategy**

**Current Crime Load Analysis:**
- **Total Incidents**: {total_crimes:,} crimes
- **Daily Average**: {int(total_crimes / 365):,} crimes per day
- **Peak Hour Load**: {peak_hours[0]['count'] if peak_hours else 0} crimes/hour

**Recommended Patrol Distribution:**

**By Time of Day:**
- **Evening Shift (6 PM - 2 AM)**: 45% of officers
  - Covers {sum(h['count'] for h in hourly_data if 18 <= h['hour'] <= 23):,} crimes
- **Day Shift (6 AM - 6 PM)**: 35% of officers
  - Business hours coverage
- **Overnight (2 AM - 6 AM)**: 20% of officers
  - Preventive presence

**By Day of Week:**
- **Friday-Saturday**: 35% of resources ({weekend_crimes:,} weekend crimes)
- **Monday-Thursday**: 50% of resources ({int(weekday_crimes * 4/5):,} weekday crimes)
- **Sunday**: 15% of resources (lowest activity day)

**Specialized Units:**
- **Rapid Response Team**: 15% of force (peak hour emergencies)
- **Community Policing**: 20% of force (prevention programs)
- **Investigation Unit**: 25% of force (follow-up on major crimes)
- **Traffic/Special Events**: 15% of force (crowd control)

{self._generate_geographic_distribution_text()}

**Efficiency Metrics:**
- **Response Time Target**: <5 minutes for priority calls
- **Coverage Ratio**: 85% of high-risk areas patrolled daily
- **Prevention Focus**: 60% of resources on proactive measures"""

    def _general_help_response(self, data_context):
        """Helpful general response with suggestions"""
        return f"""🤖 **Crime Analysis AI Assistant**

I can help you analyze your comprehensive crime dataset with {data_context.get('total_crimes', 0):,} incidents across {len(data_context.get('crime_types', []))} crime categories.

**Available Analysis Types:**

📈 **Trend Analysis**
- "What's the overall crime trend?"
- "How have crime rates changed over time?"
- "What's the growth rate analysis?"

🕐 **Temporal Patterns**
- "When do most crimes happen?"
- "What's the hourly crime distribution?"
- "How do weekends compare to weekdays?"

📊 **Crime Categories**
- "What are the most common crime types?"
- "Show me theft patterns"
- "Analyze burglary trends"

🔮 **Predictions & Forecasting**
- "What should we expect next month?"
- "Predict crime trends for next year"
- "Forecast seasonal patterns"

👮 **Resource Planning**
- "How should we allocate police resources?"
- "What's the optimal patrol schedule?"
- "Recommend prevention strategies"

📍 **Location Analysis**
- "Where do most crimes occur?"
- "Show me crime hotspots"
- "Analyze geographic patterns"

**Quick Insights from Your Data:**
- **Top Crime**: {data_context.get('crime_types', [{}])[0].get('type', 'N/A')} ({data_context.get('crime_types', [{}])[0].get('percentage', 0)}%)
- **Peak Time**: {max(data_context.get('temporal_patterns', {}).get('hourly', []), key=lambda x: x.get('count', 0), default={'hour': 0})['hour']:02d}:00 hours
- **Weekly Pattern**: {data_context.get('weekday_weekend', {}).get('weekdays', 0)} weekday vs {data_context.get('weekday_weekend', {}).get('weekends', 0)} weekend incidents

What specific aspect of your crime data would you like me to analyze?"""

    def _calculate_crime_concentration(self, crime_types):
        """Calculate Gini coefficient for crime concentration"""
        if not crime_types:
            return 0

        # Simple concentration measure
        total = sum(c['percentage'] for c in crime_types)
        max_possible = 100  # If one crime type had everything
        actual = max(c['percentage'] for c in crime_types)

        return actual / max_possible

    def _generate_geographic_distribution_text(self) -> str:
        """Generate formatted geographic distribution text with validation"""
        dist = {'high_density': 40, 'medium_risk': 35, 'low_risk': 25}  # Moved from constants
        total = sum(dist.values())

        # Error handling: validate percentages sum to 100
        if total != 100:
            raise ValueError(f"Resource distribution percentages must sum to 100%, current sum: {total}%")

        return f"""**Geographic Distribution:**
- **High-Density Areas**: {dist['high_density']}% of resources (top crime zones)
- **Medium-Risk Areas**: {dist['medium_risk']}% of resources (moderate activity)
- **Low-Risk Areas**: {dist['low_risk']}% of resources (preventive coverage)"""

    # Simplified versions of remaining methods for brevity
    def _weekday_weekend_response(self, data_context, query):
        weekday_weekend = data_context.get('weekday_weekend', {})
        weekdays = weekday_weekend.get('weekdays', 0)
        weekends = weekday_weekend.get('weekends', 0)
        weekend_ratio = weekends / max(weekends + weekdays, 1) * 100
        weekday_ratio = weekdays / max(weekends + weekdays, 1) * 100

        return f"""📅 **Weekday vs Weekend Crime Analysis**
- **Weekdays**: {weekdays:,} incidents ({weekday_ratio:.1f}%)
- **Weekends**: {weekends:,} incidents ({weekend_ratio:.1f}%)
- **Weekend Premium**: {((weekends/2) / (weekdays/5) * 100 - 100):+.1f}% higher per day"""

    def _monthly_seasonal_response(self, data_context, query):
        monthly_data = data_context.get('temporal_patterns', {}).get('monthly', [])
        if not monthly_data:
            return "Insufficient monthly data for seasonal analysis."
        peak_month = max(monthly_data, key=lambda x: x['count'])
        low_month = min(monthly_data, key=lambda x: x['count'])
        seasonal_variation = (peak_month['count'] - low_month['count']) / low_month['count'] * 100

        return f"""📆 **Monthly & Seasonal Crime Analysis**
- **Busiest Month**: Month {peak_month['month']} ({peak_month['count']:,} incidents)
- **Quietest Month**: Month {low_month['month']} ({low_month['count']:,} incidents)
- **Seasonal Variation**: {seasonal_variation:.1f}% difference"""

    def _location_analysis_response(self, data_context, query):
        geo_dist = data_context.get('geographic_distribution', {})
        top_cities = geo_dist.get('top_cities', [])
        total_crimes = data_context.get('total_crimes', 0)
        if not top_cities:
            return "Insufficient geographic data for analysis."
        return f"""📍 **Geographic Crime Analysis**
**Top Crime Locations:**
{chr(10).join([f"- **{city['city']}**: {city['count']:,} incidents" for city in top_cities])}
- **Top City**: {top_cities[0]['city']} accounts for {(top_cities[0]['count'] / total_crimes * 100) if total_crimes > 0 else 0:.1f}% of crimes."""

    def _hotspot_analysis_response(self, data_context, query):
        return f"""🎯 **Crime Hotspot Analysis**
- **Concentration Areas**: Top 20% of locations account for ~80% of crimes
- **Risk Zones**: Areas with crime rates 2x above average
- **Emerging Hotspots**: Locations showing recent crime increases"""

    def _risk_assessment_response(self, data_context, query):
        total_crimes = data_context.get('total_crimes', 0)
        crime_types = data_context.get('crime_types', [])
        high_risk_types = [c for c in crime_types if c.get('percentage', 0) > 15]
        risk_score = len(high_risk_types) * 10 + (total_crimes / 1000)

        return f"""⚠️ **Comprehensive Risk Assessment**
**Overall Risk Level:** {'High' if risk_score > 50 else 'Moderate' if risk_score > 25 else 'Low'} ({risk_score:.1f}/100)
**High-Risk Categories:** {chr(10).join([f"- **{crime['type']}**: {crime['percentage']}% of all incidents" for crime in high_risk_types])}"""

    def _strategy_recommendations_response(self, data_context, query):
        return f"""🎯 **Strategic Crime Prevention Recommendations**
**Data-Driven Strategies:**
1. **Temporal Optimization:** Deploy 45% of resources during evening peak hours
2. **Categorical Focus:** Develop specialized units for top 3 crime categories
3. **Geographic Targeting:** Concentrate 40% of resources on high-density crime areas
4. **Community Engagement:** Partner with local businesses for crime prevention
5. **Technology Integration:** Deploy predictive policing algorithms"""

    def _comparative_analysis_response(self, data_context, query):
        yearly_data = data_context.get('temporal_patterns', {}).get('yearly', [])
        if len(yearly_data) < 2:
            return "Need at least 2 years of data for comparative analysis."
        recent = sorted(yearly_data, key=lambda x: x['year'], reverse=True)[:2]
        year1, year2 = recent[0], recent[1]
        change = ((year1['count'] - year2['count']) / year2['count']) * 100

        return f"""📊 **Comparative Crime Analysis**
- **{year1['year']}**: {year1['count']:,} incidents
- **{year2['year']}**: {year2['count']:,} incidents
- **Change**: {change:+.1f}% ({'increase' if change > 0 else 'decrease'})"""

    def _extremes_analysis_response(self, data_context, query):
        hourly_data = data_context.get('temporal_patterns', {}).get('hourly', [])
        monthly_data = data_context.get('temporal_patterns', {}).get('monthly', [])
        crime_types = data_context.get('crime_types', [])
        if not hourly_data or not monthly_data or not crime_types:
            return "Insufficient data for extremes analysis."
        peak_hour = max(hourly_data, key=lambda x: x['count'])
        low_hour = min(hourly_data, key=lambda x: x['count'])
        peak_month = max(monthly_data, key=lambda x: x['count'])
        low_month = min(monthly_data, key=lambda x: x['count'])
        top_crime = crime_types[0]
        low_crime = crime_types[-1] if len(crime_types) > 1 else crime_types[0]

        return f"""📈 **Crime Data Extremes Analysis**
**Peak Performance:**
- **Busiest Hour**: {peak_hour['hour']:02d}:00 ({peak_hour['count']} incidents)
- **Busiest Month**: Month {peak_month['month']} ({peak_month['count']} incidents)
- **Most Common Crime**: {top_crime['type']} ({top_crime['percentage']}%)

**Low Points:**
- **Quietest Hour**: {low_hour['hour']:02d}:00 ({low_hour['count']} incidents)
- **Quietest Month**: Month {low_month['month']} ({low_month['count']} incidents)
- **Rarest Crime**: {low_crime['type']} ({low_crime['percentage']}%)"""

    def _correlation_analysis_response(self, data_context, query):
        return f"""🔗 **Crime Correlation & Impact Analysis**
**Temporal Correlations:** Time of day strongly correlates with property crimes
**Crime Type Relationships:** Property crimes cluster in commercial areas
**Geographic Correlations:** Commercial areas show high theft correlation"""

    def _external_factors_response(self, data_context, query):
        return f"""🌍 **External Factors Impact Analysis**
**Socioeconomic Factors:** Unemployment rates may correlate with property crimes
**Environmental Factors:** Weather patterns affect outdoor activities
**Policy Factors:** Police presence impacts crime reporting"""

    def _data_collection_improvement_response(self, data_context, query):
        """Comprehensive data collection improvement recommendations"""
        return f"""🔧 **Data Collection & Analysis Enhancement Strategy**

**Current Data Limitations:**
1. **Temporal Granularity Gap:** Monthly/yearly aggregation prevents short-term trend analysis
2. **Event-Based Analysis Deficiency:** No correlation with local events

**Proposed Improvements:**
**Phase 1:** Daily crime data collection with hour-level precision
**Phase 2:** Event data integration and real-time streams
**Phase 3:** Predictive modeling and early warning systems

**Expected Benefits:**
- 50% improvement in crime trend detection speed
- 30% increase in prevention program effectiveness
- 25% reduction in response times to crime spikes"""