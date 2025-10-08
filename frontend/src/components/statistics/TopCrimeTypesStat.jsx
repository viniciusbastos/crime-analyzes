import React from "react";

const TopCrimeTypesStat = ({ summaryData, isDark }) => {
  return (
    <div className={isDark ? "text-gray-300" : "text-gray-700"}>
      <strong className={isDark ? "text-white" : "text-gray-900"}>
        Top Crime Types:
      </strong>
      <ul className="mt-2 ml-4 list-disc">
        {summaryData?.crime_types && summaryData.crime_types.length > 0 ? (
          summaryData.crime_types.slice(0, 5).map((type) => (
            <li
              key={type.crime_type}
              className={isDark ? "text-gray-300" : "text-gray-600"}
            >
              {type.crime_type}: {type.count}
            </li>
          ))
        ) : (
          <li className={isDark ? "text-gray-300" : "text-gray-600"}>
            Loading...
          </li>
        )}
      </ul>
    </div>
  );
};

export default TopCrimeTypesStat;