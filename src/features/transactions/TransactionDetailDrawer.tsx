'use client';

import { ArrowDownLeft, ArrowUpRight, Clock3, Shield, Wallet as WalletIcon } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/dashboard/risk-badge';
import { KeyValue } from '@/components/dashboard/stat-card';
import type { Transaction } from '@/types/domain';
import { formatCurrency, formatDateTime, truncateHash } from '@/lib/format';
import { transactionStatus } from '@/lib/status';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetailDrawer({ transaction, open, onClose }: TransactionDetailDrawerProps) {
  if (!transaction) return null;

  const status = transactionStatus(transaction.status);
  const outbound = transaction.direction === 'outbound';
  const Icon = outbound ? ArrowUpRight : ArrowDownLeft;

  return (
    <Dialog open={open} onClose={onClose} title="Transaction details" description="Audit trail and execution metadata" size="lg">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-md ${
                outbound ? 'bg-surface-secondary text-foreground' : 'bg-success-soft text-success'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight tabular">
                {outbound ? '−' : '+'}
                {formatCurrency(transaction.amount, transaction.asset)}
              </p>
              <p className="text-2xs uppercase tracking-[0.18em] text-foreground-secondary">
                {transaction.direction} settlement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} dot>
              {status.label}
            </Badge>
            <RiskBadge score={transaction.riskScore} showScore />
          </div>
        </div>

        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <KeyValue label="Counterparty">{transaction.counterparty}</KeyValue>
          <KeyValue label="Address" mono>
            {truncateHash(transaction.counterpartyAddress, 6, 6)}
          </KeyValue>
          <KeyValue label="Purpose">{transaction.purpose}</KeyValue>
          <KeyValue label="Agent">{transaction.agentName ?? 'Unassigned agent'}</KeyValue>
          <KeyValue label="Asset">{transaction.asset}</KeyValue>
          <KeyValue label="USD value">{formatCurrency(transaction.usdValue, 'USDC')}</KeyValue>
          <KeyValue label="Created">{formatDateTime(transaction.createdAt)}</KeyValue>
          <KeyValue label="Policy state">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-gold" aria-hidden />
              {transaction.policyId ? `Policy #${transaction.policyId}` : 'No policy snapshot'}
            </span>
          </KeyValue>
          {transaction.stellarHash && (
            <KeyValue label="Stellar hash" className="sm:col-span-2" mono>
              {truncateHash(transaction.stellarHash, 8, 8)}
            </KeyValue>
          )}
          {transaction.memo && (
            <KeyValue label="Memo" className="sm:col-span-2">
              {transaction.memo}
            </KeyValue>
          )}
        </dl>

        <div className="rounded-card border border-border bg-surface-secondary/30 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            Execution trail
          </div>
          <ul className="space-y-3 text-sm text-foreground">
            <li className="flex items-center justify-between gap-3 border-b border-border pb-2">
              <span className="text-foreground-secondary">Status</span>
              <span className="font-medium">{status.label}</span>
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-border pb-2">
              <span className="text-foreground-secondary">Wallet</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <WalletIcon className="h-3.5 w-3.5 text-gold" aria-hidden />
                {transaction.walletId}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-foreground-secondary">Amount</span>
              <span className="font-medium tabular">
                {formatCurrency(transaction.amount, transaction.asset)}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
}
