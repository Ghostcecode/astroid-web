'use client';

import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/dashboard/risk-badge';
import { transactionStatus } from '@/lib/status';
import { formatCurrency, formatRelativeTime, truncateHash } from '@/lib/format';
import type { Transaction } from '@/types/domain';

interface TransactionTableProps {
  transactions: Transaction[];
  onSelect?: (transaction: Transaction) => void;
  className?: string;
}

export function TransactionTable({ transactions, className }: TransactionTableProps) {
  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'counterparty',
        header: 'Counterparty',
        cell: ({ row }) => {
          const tx = row.original;
          return (
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{tx.counterparty}</p>
              <p className="tabular text-2xs text-foreground-muted">{truncateHash(tx.counterpartyAddress)}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'purpose',
        header: 'Purpose',
        cell: ({ row }) => <span className="text-foreground-secondary">{row.original.purpose}</span>,
      },
      {
        accessorKey: 'agentName',
        header: 'Agent',
        cell: ({ row }) => <span className="text-foreground-secondary">{row.original.agentName ?? '—'}</span>,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const tx = row.original;
          const outbound = tx.direction === 'outbound';
          const Icon = outbound ? ArrowUpRight : ArrowDownLeft;
          return (
            <span
              className={`inline-flex items-center justify-end gap-1 font-medium tabular ${
                outbound ? 'text-foreground' : 'text-success'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {outbound ? '−' : '+'}
              {formatCurrency(tx.amount, tx.asset)}
            </span>
          );
        },
        meta: { className: 'text-right' },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = transactionStatus(row.original.status);
          return (
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'riskScore',
        header: 'Risk',
        cell: ({ row }) => <RiskBadge score={row.original.riskScore} />, 
      },
      {
        accessorKey: 'createdAt',
        header: 'When',
        cell: ({ row }) => (
          <span className="text-2xs text-foreground-muted">{formatRelativeTime(row.original.createdAt)}</span>
        ),
        meta: { className: 'text-right' },
      },
    ],
    [],
  );

  return (
    <DataTable
      data={transactions}
      columns={columns}
      getRowId={(row) => row.id}
      searchable
      searchPlaceholder="Search counterparty, purpose, or asset"
      pageSize={8}
      className={className}
      caption="Transactions"
      emptyState={
        <div className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-secondary">
          No matching transactions.
        </div>
      }
    />
  );
}

export default TransactionTable;
