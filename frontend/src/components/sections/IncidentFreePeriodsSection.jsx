import React, { useState } from "react";
import Select from "react-select";
import { useIncidentFreePeriods, useCityData } from "../../hooks/useCrimeData";

const IncidentFreePeriodsSection = () => {
  const [selectedCity, setSelectedCity] = useState("");
  const { data: cityData, isLoading: citiesLoading } = useCityData();
  const {
    data: incidentFreeData,
    isLoading,
    error,
  } = useIncidentFreePeriods(selectedCity, !!selectedCity);

  const cities = cityData?.map((city) => city.city).sort() || [];
  const cityOptions = cities.map((city) => ({ value: city, label: city }));

  const formatDays = (days) => {
    if (days === 0) return "0 days";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Análise de Períodos sem Incidentes
        </h2>
        <p className="text-gray-600">
          Analise períodos sem incidentes para cidades específicas
        </p>
      </div>

      {/* City Selection */}
      <div className="mb-6">
        <label
          htmlFor="city-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select City
        </label>
        <Select
          id="city-select"
          value={selectedCity ? { value: selectedCity, label: selectedCity } : null}
          onChange={(option) => setSelectedCity(option ? option.value : "")}
          options={cityOptions}
          isLoading={citiesLoading}
          placeholder={citiesLoading ? "Carregando cidades..." : "Escolha uma cidade"}
          isClearable
          className="w-full max-w-md"
          styles={{
            control: (provided) => ({
              ...provided,
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              '&:hover': {
                borderColor: '#9ca3af',
              },
              '&:focus-within': {
                borderColor: '#3b82f6',
                boxShadow: '0 0 0 1px #3b82f6',
              },
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
              color: state.isSelected ? 'white' : '#374151',
            }),
          }}
        />
      </div>

      {/* Results Display */}
      {selectedCity && (
        <div className="space-y-6">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">
                Analisando períodos sem incidentes...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading data
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error.message ||
                      "Failed to fetch incident-free period data"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {incidentFreeData && !isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Longest Streak Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-green-800">
                      Sequência Mais Longa
                    </h3>
                    <p className="text-3xl font-bold text-green-900">
                      {formatDays(incidentFreeData.longest_streak)}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Máximo de dias consecutivos sem incidentes
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Streak Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-blue-800">
                      Período Atual
                    </h3>
                    <p className="text-3xl font-bold text-blue-900">
                      {formatDays(incidentFreeData.current_streak)}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Dias desde o último incidente
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Detalhes da Análise para {incidentFreeData.city}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total de Incidentes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {incidentFreeData.total_crimes}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Período de Análise</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(incidentFreeData.analysis_period?.start)} -{" "}
                      {formatDate(incidentFreeData.analysis_period?.end)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Último Incidente</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(incidentFreeData.last_crime_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {incidentFreeData?.message && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    {incidentFreeData.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IncidentFreePeriodsSection;
