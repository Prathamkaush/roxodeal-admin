"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "./ui/button";

export function TableShimmer({ columns = 5 }: { columns?: number }) {
  return (
    <div
      className="ms-table-wrap"
      role="status"
      aria-label="Loading records"
      aria-busy="true"
    >
      <table className="ms-table" aria-hidden="true">
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, col) => (
                <td key={col}>
                  <div className="ms-shimmer" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Filter<T> = {
  label: string;
  value: (item: T) => string;
  options?: string[];
};
export function RecordList<T>({
  items,
  searchText,
  filters = [],
  children,
  loading = false,
  columns = 5,
  label,
  dateValue,
}: {
  items: T[];
  searchText: (item: T) => string;
  filters?: Filter<T>[];
  children: (items: T[]) => ReactNode;
  loading?: boolean;
  columns?: number;
  label: string;
  dateValue?: (item: T) => string;
}) {
  const params = useSearchParams();
  const initialSearch = params.get("q") || "";
  const [search, setSearch] = useState(initialSearch);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => {
    setSearch(initialSearch);
    setPage(1);
    setSelected({});
  }, [initialSearch]);
  const filtered = items.filter(
    (item) =>
      searchText(item).toLowerCase().includes(search.trim().toLowerCase()) &&
      filters.every(
        (filter) =>
          !selected[filter.label] ||
          filter.value(item) === selected[filter.label],
      ) &&
      (!dateValue ||
        ((!from || dateValue(item).slice(0, 10) >= from) &&
          (!to || dateValue(item).slice(0, 10) <= to))),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const start = (current - 1) * size;
  return (
    <section className="ms-card ms-record-list" aria-label={label}>
      <div className="ms-list-filters">
        <label className="ms-field ms-list-search">
          Search {label.toLowerCase()}
          <input
            type="search"
            value={search}
            placeholder="Search records…"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        {filters.map((filter) => (
          <label className="ms-field" key={filter.label}>
            {filter.label}
            <select
              value={selected[filter.label] || ""}
              onChange={(e) => {
                setSelected({ ...selected, [filter.label]: e.target.value });
                setPage(1);
              }}
            >
              <option value="">All {filter.label.toLowerCase()}</option>
              {(
                filter.options ||
                [...new Set(items.map(filter.value))].filter(Boolean).sort()
              ).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
        {dateValue && (
          <>
            <label className="ms-field">
              From date
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="ms-field">
              To date
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </label>
          </>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setSearch("");
            setSelected({});
            setFrom("");
            setTo("");
            setPage(1);
          }}
        >
          Clear filters
        </Button>
      </div>
      {loading ? (
        <TableShimmer columns={columns} />
      ) : (
        <>
          <div className="ms-table-wrap">
            {children(filtered.slice(start, start + size))}
          </div>
          {!filtered.length && (
            <div className="ms-list-empty" role="status">
              {items.length
                ? "No records match your filters."
                : "No records yet."}
            </div>
          )}
        </>
      )}
      <div className="ms-list-pagination">
        <span role="status">
          {loading
            ? "Loading records…"
            : `${filtered.length ? start + 1 : 0}–${Math.min(start + size, filtered.length)} of ${filtered.length} records`}
        </span>
        <label className="ms-field">
          Rows per page{" "}
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <div className="ms-pagination-buttons">
          <Button
            size="sm"
            variant="outline"
            disabled={loading || current === 1}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Button>
          <span>
            Page {current} of {pages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || current === pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
