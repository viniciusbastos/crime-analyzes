import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useTheme } from "../ThemeContext";

const CityInfoChart = ({ data }) => {
  const { isDark } = useTheme();
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect();
        setDimensions({ width: width || 600, height: 400 });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || !data.length || !dimensions.width) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 100, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get all unique years across all cities
    const allYears = [
      ...new Set(data.flatMap((city) => city.years.map((y) => y.year))),
    ].sort();

    // Scales
    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.city))
      .range([0, width])
      .padding(0.1);

    const x1 = d3
      .scaleBand()
      .domain(allYears)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.total_crimes)])
      .nice()
      .range([height, 0]);

    // Colors for different years
    const yearColors = isDark
      ? ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
      : ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#db2777"];

    // Create groups for each city
    const cityGroups = svg
      .selectAll(".city-group")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "city-group")
      .attr("transform", (d) => `translate(${x0(d.city)},0)`);

    // Add bars for each year within each city
    cityGroups
      .selectAll(".year-bar")
      .data((d) => d.years)
      .enter()
      .append("rect")
      .attr("class", "year-bar")
      .attr("x", (d) => x1(d.year))
      .attr("y", (d) => y(d.count))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => height - y(d.count))
      .attr(
        "fill",
        (d) => yearColors[allYears.indexOf(d.year) % yearColors.length]
      )
      .attr("rx", 2)
      .style("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this).style("opacity", 1);

        // Find the city data
        const cityData = data.find((city) => city.years.includes(d));

        // Tooltip
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", isDark ? "#374151" : "#ffffff")
          .style("border", `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`)
          .style("border-radius", "6px")
          .style("padding", "8px 12px")
          .style("font-size", "12px")
          .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)")
          .style("pointer-events", "none")
          .style("z-index", 1000)
          .style("color", isDark ? "#f3f4f6" : "#111827").html(`
            <div style="font-weight: 600; margin-bottom: 4px;">${cityData.city} - ${d.year}</div>
            <div>Crimes: ${d.count}</div>
            <div>Total for city: ${cityData.total_crimes}</div>
            <div>City percentage: ${cityData.percentage}%</div>
          `);

        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).style("opacity", 0.8);
        d3.selectAll(".tooltip").remove();
      });

    // X axis (cities)
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "11px")
      .style("fill", isDark ? "#e5e7eb" : "#374151");

    // Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", isDark ? "#e5e7eb" : "#374151");

    // Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", isDark ? "#e5e7eb" : "#374151")
      .text("Number of Crimes");

    // X axis label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 20)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", isDark ? "#e5e7eb" : "#374151")
      .text("Cities");

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 120}, -margin.top + 10)`);

    allYears.forEach((year, i) => {
      const legendRow = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 15})`);

      legendRow
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", yearColors[i % yearColors.length]);

      legendRow
        .append("text")
        .attr("x", 18)
        .attr("y", 9)
        .style("font-size", "11px")
        .style("fill", isDark ? "#e5e7eb" : "#374151")
        .text(year);
    });

    // Title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", isDark ? "#f3f4f6" : "#111827")
      .text("Crime Distribution by City and Year");
  }, [data, dimensions, isDark]);

  if (!data || !data.length) {
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
          City Information
        </h3>
        <div
          className={`text-center py-8 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          No city data available
        </div>
      </div>
    );
  }

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
        City Information
      </h3>
      <div className="overflow-x-auto">
        <svg ref={svgRef} className="w-full h-96"></svg>
      </div>
      <div
        className={`mt-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
      >
        <p>
          Total cities: {data.length} | Total crimes:{" "}
          {data.reduce((sum, city) => sum + city.total_crimes, 0)}
        </p>
      </div>
    </div>
  );
};

export default CityInfoChart;
