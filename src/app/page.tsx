"use client";

import { useMemo, useState } from "react";
import useAdvocates from "../hooks/useAdvocates";
import useDebouncedValue from "../hooks/useDebouncedValue";

export default function Home() {
  const { data, isLoading, error } = useAdvocates();
  const [searchTerm, setSearchTerm] = useState("");
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
   setSearchTerm("");
  }

  return (
    <main style={{ margin: "24px" }}>
      <h1>Solace Advocates</h1>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="search-input">Search</label>
        <div>
          Searching for: <span id="search-term">{searchTerm}</span>
        </div>

        <input
          id="search-input"
          style={{ border: "1px solid black", padding: 6 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type name, city, specialty or years of experience"
        />

        <button onClick={handleOnClickReset} style={{ marginLeft: 8 }}>
          Reset Search
        </button>
      </div>

      {isLoading && <div>Loading advocates...</div>}
      {error && <div style={{ color: "red" }}>Error: {String(error.message)}</div>}

      <table>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>City</th>
            <th>Degree</th>
            <th>Specialties</th>
            <th>Years of Experience</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((advocate) => (
            <tr key={advocate.phoneNumber}>
              <td>{advocate.firstName}</td>
              <td>{advocate.lastName}</td>
              <td>{advocate.city}</td>
              <td>{advocate.degree}</td>
              <td>
                {advocate.specialties.map((s, i) => (
                  <div key={`s${i}`}>{s}</div>
                ))}
              </td>
              <td>{advocate.yearsOfExperience}</td>
              <td>{advocate.phoneNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
