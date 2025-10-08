import { Bar } from "react-chartjs-2";
import { useTheme } from "../ThemeContext";
import { useChartExport } from "../../hooks/useChartExport";

const YearOverYearChart = ({ data }) => {
  useChartExport();
  const { isDark } = useTheme();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? "#e5e7eb" : "#374151",
        },
        grid: {
          color: isDark ? "#374151" : "#e5e7eb",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: isDark ? "#e5e7eb" : "#374151",
          callback: function (value) {
            return value + "%";
          },
        },
        grid: {
          color: isDark ? "#374151" : "#e5e7eb",
        },
      },
    },
  };

  return (
    <div
      className={`rounded-lg shadow p-6 ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <h3
        className={`text-xl font-semibold mb-4 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Year-over-Year Comparison
      </h3>
      {data &&
        data?.year_over_year?.length > 0 &&
        (console.log("Year over Year Data:", data),
        (
          <Bar
            data={{
              labels: data?.year_over_year.map((item) => item.year.toString()),
              datasets: [
                {
                  label: "YoY Change %",
                  data: data.year_over_year.map((item) => item.change_percent),
                  backgroundColor: data.year_over_year.map((item) =>
                    item.change_percent > 0
                      ? "rgba(255, 99, 132, 0.6)"
                      : "rgba(75, 192, 192, 0.6)"
                  ),
                  borderColor: data.year_over_year.map((item) =>
                    item.change_percent > 0
                      ? "rgba(255, 99, 132, 1)"
                      : "rgba(75, 192, 192, 1)"
                  ),
                  borderWidth: 1,
                },
              ],
            }}
            options={chartOptions}
          />
        ))}
    </div>
  );
};

export default YearOverYearChart;
