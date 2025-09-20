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
    <main style={{ margin: "24px" }}>
      <header>
        <h1>Solace Advocates</h1>
      </header>

      <form
        onSubmit={(e) => e.preventDefault()}
        style={{ marginBottom: 12 }}
        role="search"
        aria-label="Advocate search"
      >
        <label htmlFor="search-input">Search</label>

        <p aria-live="polite">
          Searching for: <span id="search-term">{searchTerm}</span>
        </p>

        <input
          id="search-input"
          aria-describedby="search-help"
          style={{ border: "1px solid black", padding: 6 }}
          value={searchTerm}
          onChange={handleOnChangeSearch}
          placeholder="Type name, city, specialty or years of experience"
        />

        <div id="search-help" style={{ position: 'absolute', left: -9999 }}>
          Enter text to filter advocates by name, city, specialty, degree or years of experience.
        </div>

        <button
          type="button"
          onClick={handleOnClickReset}
          aria-label="Reset search"
          style={{ marginLeft: 8 }}
        >
          Reset Search
        </button>
  </form>
      {isLoading && (
        <div role="status" aria-live="polite">
          Loading advocates...
        </div>
      )}

      {error && (
        <div role="alert" style={{ color: "red" }}>
          Error: {String(error.message)}
        </div>
      )}
      <section aria-labelledby="results-heading">
        <h2 id="results-heading" style={{ position: 'absolute', left: -9999 }}>
          Search results
        </h2>
        <table>
          <caption>List of Solace advocates matching your search</caption>
          <thead>
            <tr>
              <th scope="col">First Name</th>
              <th scope="col">Last Name</th>
              <th scope="col">City</th>
              <th scope="col">Degree</th>
              <th scope="col">Specialties</th>
              <th scope="col">Years of Experience</th>
              <th scope="col">Phone Number</th>
            </tr>
          </thead>
        <tbody>
          {filtered.map((advocate) => (
            <tr key={advocate.phoneNumber}>
              <th scope="row">{advocate.firstName}</th>
              <td>{advocate.lastName}</td>
              <td>{advocate.city}</td>
              <td>{advocate.degree}</td>
              <td>
                  {advocate.specialties.map((s, i) => (
                    <div key={`s${i}`}>{s}</div>
                  ))}
              </td>
              <td>{advocate.yearsOfExperience}</td>
              <td>
                <a href={`tel:${advocate.phoneNumber}`}>{advocate.phoneNumber}</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </section>
    </main>
  );
}
