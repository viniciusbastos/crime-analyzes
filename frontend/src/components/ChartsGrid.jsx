import React, { Suspense, lazy } from "react";
import LoadingSpinner from "./LoadingSpinner";

// Lazy load all chart components
const HourlyChart = lazy(() => import("./charts/HourlyChart"));
const WeekdayWeekendChart = lazy(() => import("./charts/WeekdayWeekendChart"));
const HourlyWeekdayChart = lazy(() => import("./charts/HourlyWeekdayChart"));
const HourlyWeekendChart = lazy(() => import("./charts/HourlyWeekendChart"));
const MonthlyChart = lazy(() => import("./charts/MonthlyChart"));
const YearOverYearChart = lazy(() => import("./charts/YearOverYearChart"));
const MovingAveragesChart = lazy(() => import("./charts/MovingAveragesChart"));
const GrowthRateChart = lazy(() => import("./charts/GrowthRateChart"));
const ForecastChart = lazy(() => import("./charts/ForecastChart"));
const CrimeTypesChart = lazy(() => import("./charts/CrimeTypesChart"));
const CrimeInsights = lazy(() => import("./charts/CrimeInsights"));
const CityInfoChart = lazy(() => import("./charts/CityInfoChart"));
const SemesterComparisonChart = lazy(() =>
  import("./charts/SemesterComparisonChart")
);
const CrimeTrendsWeeklyChart = lazy(() =>
  import("./charts/CrimeTrendsWeeklyChart")
);

const ChartsGrid = ({
  temporalData,
  trendData,
  summaryData,
  cityData,
  semesterComparisonData,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Suspense
          fallback={
            <LoadingSpinner size="sm" message="Loading hourly chart..." />
          }
        >
          <HourlyChart data={temporalData?.hourly} />
        </Suspense>
        <Suspense
          fallback={
            <LoadingSpinner size="sm" message="Loading weekday chart..." />
          }
        >
          <WeekdayWeekendChart data={temporalData?.weekend_comparison} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Suspense
          fallback={
            <LoadingSpinner size="sm" message="Loading weekday hours..." />
          }
        >
          <HourlyWeekdayChart data={temporalData?.hourly_weekday} />
        </Suspense>
        <Suspense
          fallback={
            <LoadingSpinner size="sm" message="Loading weekend hours..." />
          }
        >
          <HourlyWeekendChart data={temporalData?.hourly_weekend} />
        </Suspense>
        <Suspense
          fallback={
            <LoadingSpinner size="sm" message="Loading monthly chart..." />
          }
        >
          <MonthlyChart data={temporalData} />
        </Suspense>
      </div>

      {trendData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Suspense
              fallback={
                <LoadingSpinner size="sm" message="Loading year-over-year..." />
              }
            >
              <YearOverYearChart data={trendData?.yearOverYearData} />
            </Suspense>
            <Suspense
              fallback={
                <LoadingSpinner
                  size="sm"
                  message="Loading moving averages..."
                />
              }
            >
              <MovingAveragesChart data={trendData?.movingAveragesData} />
            </Suspense>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Suspense
              fallback={
                <LoadingSpinner size="sm" message="Loading growth rates..." />
              }
            >
              <GrowthRateChart data={trendData.growthRatesData} />
            </Suspense>
            <Suspense
              fallback={
                <LoadingSpinner size="sm" message="Loading forecast..." />
              }
            >
              <ForecastChart data={trendData.forecastData} />
            </Suspense>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            <Suspense
              fallback={
                <LoadingSpinner size="sm" message="Loading weekly trends..." />
              }
            >
              <CrimeTrendsWeeklyChart data={trendData?.weeklyMovingAveragesData} />
            </Suspense>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Suspense
          fallback={
            <LoadingSpinner size="sm" message="Loading crime types..." />
          }
        >
          <CrimeTypesChart data={summaryData?.crime_types} />
        </Suspense>
        <Suspense
          fallback={<LoadingSpinner size="sm" message="Loading insights..." />}
        >
          <CrimeInsights temporalData={temporalData} />
        </Suspense>
      </div>

      {/* City Information Chart */}
      {cityData && cityData.length > 0 && (
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Suspense
            fallback={
              <LoadingSpinner size="sm" message="Loading city data..." />
            }
          >
            <CityInfoChart data={cityData} />
          </Suspense>
        </div>
      )}

      {/* Semester Comparison Chart */}
      {semesterComparisonData && semesterComparisonData.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <Suspense
            fallback={
              <LoadingSpinner size="sm" message="Loading semester comparison..." />
            }
          >
            <SemesterComparisonChart data={semesterComparisonData} />
          </Suspense>
        </div>
      )}
    </>
  );
};

export default ChartsGrid;
