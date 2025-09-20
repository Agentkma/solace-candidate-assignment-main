"use client";

import { useMemo, useState } from "react";
import useAdvocates from "../hooks/useAdvocates";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { DEFAULT_SEARCH_TERM } from "./constants";



export default function Home() {
  const { data, isLoading, error } = useAdvocates();
  const [searchTerm, setSearchTerm] = useState<string>(DEFAULT_SEARCH_TERM);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const filtered = useMemo(() => {
    const advocates = data ?? [];
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return advocates;

    const numeric = Number(term);

    return advocates.filter((a) => {
      const matchText = (value?: string) =>
        !!value && value.toLowerCase().includes(term);

      const specialtiesMatch = a.specialties.some((s) =>
        s.toLowerCase().includes(term)
      );

      return (
        matchText(a.firstName) ||
        matchText(a.lastName) ||
        matchText(a.city) ||
        matchText(a.degree) ||
        specialtiesMatch ||
        (!Number.isNaN(numeric) && a.yearsOfExperience === numeric)
      );
    });
  }, [data, debouncedSearchTerm]);

  const handleOnClickReset = () => {
   setSearchTerm(DEFAULT_SEARCH_TERM);
  }

  const handleOnChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }

  return (
    <main className="container mx-auto p-4 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Solace Advocates</h1>
      </header>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mb-4"
        role="search"
        aria-label="Advocate search"
      >
        <label htmlFor="search-input" className="block text-sm font-medium mb-1">
          Search
        </label>

        <p className="sr-only" aria-live="polite">
          Searching for: <span id="search-term">{searchTerm}</span>
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            id="search-input"
            aria-describedby="search-help"
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={searchTerm}
            onChange={handleOnChangeSearch}
            placeholder="Type name, city, specialty or years of experience"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOnClickReset}
              aria-label="Reset search"
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              Reset
            </button>
          </div>
        </div>

        <p id="search-help" className="sr-only">
          Enter text to filter advocates by name, city, specialty, degree or years of experience.
        </p>
      </form>
      {isLoading && (
        <div role="status" aria-live="polite" className="text-gray-500 mb-4">
          Loading advocates...
        </div>
      )}

      {error && (
        <div role="alert" className="text-red-600 mb-4">
          Error: {String(error.message)}
        </div>
      )}
      <section aria-labelledby="results-heading">
        <h2 id="results-heading" className="sr-only">
          Search results
        </h2>

        <div className="overflow-auto rounded border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">List of Solace advocates matching your search</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-600">First Name</th>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-600">Last Name</th>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-600">City</th>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-600">Degree</th>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-600">Specialties</th>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-600">Years</th>
                <th scope="col" className="px-4 py-2 text-left text-sm font-medium text-gray-600">Phone</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((advocate) => (
                <tr key={advocate.phoneNumber} className="hover:bg-gray-50">
                  <th scope="row" className="px-4 py-3 text-sm font-medium text-gray-900 align-top">{advocate.firstName}</th>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top">{advocate.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top">{advocate.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top">{advocate.degree}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {advocate.specialties.map((s, i) => (
                        <span key={`s${i}`} className="inline-block text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top">{advocate.yearsOfExperience}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top">
                    <a href={`tel:${advocate.phoneNumber}`} className="text-sky-600 hover:underline">{advocate.phoneNumber}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
