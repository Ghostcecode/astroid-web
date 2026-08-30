'use client';

import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

export type DataTableColumn<TData> = ColumnDef<TData, unknown>;

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  className?: string;
  emptyState?: React.ReactNode;
  caption?: string;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  searchable = false,
  searchPlaceholder = 'Search rows...',
  pageSize = 10,
  className,
  emptyState,
  caption,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = (filterValue ?? '').toString().trim().toLowerCase();
      if (!search) return true;

      const candidates = [row.original, row.getVisibleCells().map((cell) => cell.getValue())]
        .flat()
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return candidates.some((value) => value.includes(search));
    },
  });

  const pageCount = table.getPageCount();
  const canPaginate = pageCount > 1;

  const summary = useMemo(() => {
    const start = data.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1;
    const end = Math.min(
      start + table.getState().pagination.pageSize - 1,
      data.length,
    );

    return data.length === 0 ? '0 rows' : `${start}-${end} of ${data.length}`;
  }, [data.length, table]);

  return (
    <div className={cn('overflow-hidden rounded-card border border-border bg-surface', className)}>
      {(searchable || caption) && (
        <div className="flex flex-col gap-3 border-b border-border bg-surface-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          {caption && <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">{caption}</p>}
          {searchable && (
            <label className="relative block w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" aria-hidden />
              <input
                aria-label="Search table rows"
                value={globalFilter}
                onChange={(event) => {
                  setGlobalFilter(event.target.value);
                  setPagination((current) => ({ ...current, pageIndex: 0 }));
                }}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-surface-secondary/40">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as { className?: string; sticky?: boolean } | undefined;
                  const canSort = header.column.getCanSort();

                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        'px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary',
                        meta?.className,
                        canSort && 'cursor-pointer select-none',
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={cn(
                            'inline-flex items-center gap-1.5 text-left font-medium transition-colors hover:text-foreground',
                            !canSort && 'cursor-default',
                          )}
                          aria-label={canSort ? `Sort by ${header.column.columnDef.header?.toString()}` : undefined}
                        >
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          {canSort && (
                            <span aria-hidden className="text-foreground-muted">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 opacity-50" />
                              )}
                            </span>
                          )}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  {emptyState ?? (
                    <div className="flex min-h-24 items-center justify-center text-sm text-foreground-secondary">
                      No records found.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const interactive = typeof onRowClick === 'function';

                return (
                  <tr
                    key={row.id}
                    role={interactive ? 'button' : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    onClick={interactive ? () => onRowClick?.(row.original) : undefined}
                    onKeyDown={
                      interactive
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onRowClick?.(row.original);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      'transition-colors duration-fast hover:bg-surface-secondary/30',
                      interactive && 'cursor-pointer focus-visible:bg-surface-secondary focus-visible:outline-none',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-4 py-3 align-middle text-foreground',
                          (cell.column.columnDef.meta as { className?: string } | undefined)?.className,
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {canPaginate && (
        <div className="flex flex-col gap-3 border-t border-border bg-surface-secondary/20 px-4 py-3 text-xs text-foreground-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>{summary}</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              leftIcon={<ChevronLeft className="h-3.5 w-3.5" aria-hidden />}
            >
              Prev
            </Button>
            <span className="tabular-nums">
              {table.getState().pagination.pageIndex + 1} / {pageCount}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              rightIcon={<ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
