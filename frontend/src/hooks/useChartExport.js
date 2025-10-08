import { useCallback } from "react";
import html2canvas from "html2canvas";

export const useChartExport = () => {
  const exportChart = useCallback(
    async (chartRef, filename = "chart", format = "png", quality = 1.0) => {
      if (!chartRef.current) {
        console.error("Chart reference not found");
        return;
      }

      try {
        // Configure html2canvas options for better chart rendering
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: "#ffffff",
          scale: 2, // Higher resolution
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
          // Specific options for Chart.js charts
          ignoreElements: (element) => {
            // Ignore export buttons and other UI elements
            return (
              element.classList?.contains("chart-export-button") ||
              element.classList?.contains("export-ignore")
            );
          },
        });

        // Convert to blob and download
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error("Failed to generate chart image");
              return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${filename}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        console.error("Error exporting chart:", error);
        alert("Failed to export chart. Please try again.");
      }
    },
    []
  );

  const exportChartAsPNG = useCallback(
    (chartRef, filename = "chart") => {
      return exportChart(chartRef, filename, "png", 1.0);
    },
    [exportChart]
  );

  const exportChartAsJPG = useCallback(
    (chartRef, filename = "chart") => {
      return exportChart(chartRef, filename, "jpeg", 0.95);
    },
    [exportChart]
  );

  return {
    exportChart,
    exportChartAsPNG,
    exportChartAsJPG,
  };
};
