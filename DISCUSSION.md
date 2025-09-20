# Discussion

This file contains notes and suggested future improvements for the Solace candidate assignment search page. NOTE: this was written with Copilot assistance and may contain inaccuracies or suggestions that don't fit the original scope. We would need to review carefully before implementing.

## Future improvements

Below are a set of concrete improvements we can tackle in follow-up PRs. Each item includes a short explanation, suggested approach, and tradeoffs.

### 1) Pagination (or infinite scroll / virtualization)

- Why: The search table currently renders all matching results; with large datasets this will be slow and memory-heavy on the client.

- Suggested approach:

  - Add server-side pagination endpoints (for example `GET /api/advocates?q=...&page=1&perPage=50`) and change the client to request pages on demand.

  - On the client, implement one of:

    - Classic pagination controls (Prev/Next + page numbers).

    - Infinite scroll with a sentinel + `IntersectionObserver`.

    - Virtualized list (e.g., `react-window` or `react-virtual`) when the table must remain fully interactive.

- Tradeoffs:

  - Pagination reduces memory and initial load and is SEO friendly.

  - Infinite scroll improves perceived continuity but complicates navigation, back/forward behavior, and accessibility.

  - Virtualization is great for very large lists but can complicate table layouts (sticky headers, column widths).

### 2) Caching results

- Why: Repeated searches or paging across the same dataset should be fast and avoid refetching identical data.

- Suggested approach:

  - Implement client-side caching with a small in-memory LRU cache keyed by `q|page|perPage`.

  - Consider using `swr` or `react-query` for built-in caching, stale-while-revalidate, background refresh, and deduplication.

  - For server-side cost savings at scale, add HTTP caching headers and server-side cache (Redis) where appropriate.

- Tradeoffs:

  - `react-query`/`swr` speeds development and handles cache edge cases but adds a dependency.

  - Local in-memory caches are simple but are lost on reload; persistent caches (localStorage) need invalidation strategies.

### 3) Phone number formatting & normalization

- Why: Phone numbers are currently shown as raw digits, which is hard to read. `tel:` links should include only digits and `+` where appropriate.

- Suggested approach:

  - Add a small utility `src/lib/phone.ts` with these helpers:

    - `formatPhoneNumber(raw: string): string` — formats common national numbers (e.g. 10-digit US -> `(123) 456-7890`) and falls back gracefully for other inputs.

    - `normalizePhoneForHref(raw: string): string` — strips non-digit characters but preserves a leading `+` for international numbers.

  - Use the utility in UI: `href={`tel:${normalizePhoneForHref(phone)}`}` and display `formatPhoneNumber(phone)`.

- Tradeoffs:

  - Full international formatting is complex; for robust coverage consider `libphonenumber-js`. A small formatter is fine if scope is limited to common formats.

### 4) Sorting and column controls

- Why: Users may want to sort by years of experience, name, city, etc.

- Suggested approach: add clickable `TableHead` components that toggle `asc/desc`, persist sort state in the URL, and perform server-side sorting when paginated.

### 5) Accessibility & keyboard support

- Why: Improve UX for keyboard and screen reader users.

- Suggested approach: ensure focus-visible states for interactive controls, add `aria-sort` on sortable headers, support keyboard-driven pagination and a `skip to results` link where appropriate.

### 6) Tests and linting

- Why: Prevent regressions as we improve the UI.

- Suggested approach: Add React Testing Library unit tests for `TableHead`, `TableCell`, `RowHeader`, and the main `Home` page search behavior (reset, debounce, filtering). Add integration tests around pagination and caching.

### 7) Performance notes

- Defer heavy DOM updates (e.g., virtualization) and debounce user typing (we already have a debounce helper). Profile before optimizing further for large datasets.

---

## 8) Database & search scalability (Postgres-specific)

- Why: With hundreds of thousands of advocates, client-side rendering and naive queries will be too slow. Improve indexing and server-side search to keep queries fast and cost-effective.

- Priority goals:
  - Fast, relevant search across name/city/degree/specialties.
  - Low-latency paging for UI (avoid OFFSET for deep pages).
  - Efficient filtering on JSONB specialties.
  - Reliable phone storage/formatting for display and `tel:` links.

- Concrete recommendations:

  1) Add a tsvector column and GIN index for full-text search across relevant fields
     - Keeps multi-field text search fast and enables ranking with ts_rank.
     - Example migration:
     ```sql
     ALTER TABLE advocates ADD COLUMN search_tsv tsvector;

     UPDATE advocates
     SET search_tsv =
       to_tsvector('english',
         coalesce(first_name,'') || ' ' ||
         coalesce(last_name,'') || ' ' ||
         coalesce(city,'') || ' ' ||
         coalesce(degree,'') || ' ' ||
         coalesce(array_to_string(specialties::text, ' '), '')
       );

     CREATE INDEX idx_advocates_search_tsv ON advocates USING GIN(search_tsv);

     CREATE FUNCTION advocates_search_tsv_trigger() RETURNS trigger AS $$
     begin
       new.search_tsv :=
         to_tsvector('english',
           coalesce(new.first_name,'') || ' ' ||
           coalesce(new.last_name,'') || ' ' ||
           coalesce(new.city,'') || ' ' ||
           coalesce(new.degree,'') || ' ' ||
           coalesce(array_to_string(new.specialties::text, ' '), '')
         );
       return new;
     end
     $$ LANGUAGE plpgsql;

     CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
       ON advocates FOR EACH ROW EXECUTE FUNCTION advocates_search_tsv_trigger();
     ```

  2) Add trigram (pg_trgm) indexes for fast ILIKE / fuzzy name searches
     - Good for short substring or fuzzy matching on names.
     ```sql
     CREATE EXTENSION IF NOT EXISTS pg_trgm;
     CREATE INDEX idx_advocates_name_trgm ON advocates USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
     ```

  3) Index JSONB specialties with a GIN index
     - Speeds queries that filter by specialties values.
     ```sql
     CREATE INDEX idx_advocates_specialties_gin ON advocates USING gin (specialties);
     ```

  4) Switch phone storage to normalized text (E.164) and store a formatted display value
     - bigint is inconvenient for leading zeros, plus signs, or formatting.
     - Migration sketch:
     ```sql
     ALTER TABLE advocates ADD COLUMN phone_raw text;
     ALTER TABLE advocates ADD COLUMN phone_e164 text;

     UPDATE advocates
     SET phone_raw = phone_number::text,
         phone_e164 = regexp_replace(phone_number::text, '\D','','g');

     -- After verification:
     -- ALTER TABLE advocates DROP COLUMN phone_number;
     -- ALTER TABLE advocates RENAME COLUMN phone_raw TO phone_number;
     ```

  5) Use keyset (cursor) pagination instead of OFFSET/LIMIT for deep paging
     - Keyset is predictable and performs well at scale.
     ```sql
     -- page after last_id
     SELECT id, first_name, last_name, city, ...
     FROM advocates
     WHERE id > :last_id
       AND (search_tsv @@ plainto_tsquery(:q))
     ORDER BY id
     LIMIT :per_page;
     ```

  6) Consider an external search engine for advanced ranking & typo tolerance
     - Meilisearch or Elasticsearch when relevance, multi-field weighting, and advanced fuzzy behaviour are required.
     - Keep Postgres as source of truth and sync via background workers.

- Operational recommendations:
  - Use EXPLAIN ANALYZE to tune queries and add indexes based on slow queries.
  - Add connection pooling (PgBouncer) for app servers.
  - Add monitoring (pg_stat_statements, slow query alerts).
  - Consider partitioning only if single-table maintenance becomes problematic.
  - Add Redis for caching frequent queries and use HTTP caching where appropriate.

- When to escalate:
  - If search relevance, typo tolerance, or complex ranking is required across many attributes, adopt a dedicated search engine.
  - If query patterns show hot keys / heavy read pressure, add query-level caching or materialized views for expensive aggregations.

---
