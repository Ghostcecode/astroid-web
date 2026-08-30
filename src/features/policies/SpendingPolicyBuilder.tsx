'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { isValidStellarPublicKey } from '@/stores/freighter-store';

const validAddressList = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const spendingPolicySchema = z.object({
  name: z.string().trim().min(3, 'Policy name must be at least 3 characters.'),
  maxSingleTransactionLimit: z.coerce.number().positive('Maximum single transaction must be greater than zero.'),
  rollingBudgetLimit: z.coerce.number().positive('Rolling budget must be greater than zero.'),
  rollingBudgetInterval: z.enum(['daily', 'weekly', 'monthly']),
  whitelistAddresses: z
    .string()
    .trim()
    .refine((value) => {
      const addresses = validAddressList(value);
      if (addresses.length === 0) return true;
      return addresses.every((address) => isValidStellarPublicKey(address));
    }, 'Whitelist addresses must be valid Stellar public keys.'),
  allowedAssets: z.string().trim().refine((value) => {
    const assets = value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    return assets.length > 0 && assets.every((asset) => asset.length > 1);
  }, 'At least one asset is required.'),
});

export type SpendingPolicyFormValues = z.infer<typeof spendingPolicySchema>;

export function SpendingPolicyBuilder() {
  const form = useForm<SpendingPolicyFormValues>({
    resolver: zodResolver(spendingPolicySchema),
    defaultValues: {
      name: 'Treasury burn guard',
      maxSingleTransactionLimit: 2000,
      rollingBudgetLimit: 20000,
      rollingBudgetInterval: 'weekly',
      whitelistAddresses: 'GCGN7K2J2L5V4D7C7Y3M4KXH2Q5TK5A4P3W6QJDS4J2W5M5WQ4R5M, GDR5A5W4M7Z3H5Q7Q2J4W7C6QX3A9Y5K7D3V2L7S5Y5M3F4Q7B7',
      allowedAssets: 'XLM, USDC',
    },
  });

  const preview = useMemo(() => {
    const values = form.getValues();
    return {
      policyName: values.name,
      maxSingleTransactionLimit: Number(values.maxSingleTransactionLimit),
      rollingBudget: {
        limit: Number(values.rollingBudgetLimit),
        interval: values.rollingBudgetInterval,
      },
      whitelistAddresses: validAddressList(values.whitelistAddresses).filter(Boolean),
      allowedAssets: values.allowedAssets
        .split(',')
        .map((asset) => asset.trim())
        .filter(Boolean),
    };
  }, [form]);

  const submitForm = (values: SpendingPolicyFormValues) => {
    const validValues = {
      ...values,
      whitelistAddresses: validAddressList(values.whitelistAddresses),
      allowedAssets: values.allowedAssets
        .split(',')
        .map((asset) => asset.trim())
        .filter(Boolean),
    };

    // Intentionally no backend write here; the feature is a form preview and validation pass-through.
    console.info('Spending policy validated', validValues);
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-surface-secondary/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-2xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">Policy builder</p>
            <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">Spending guardrail configuration</h3>
          </div>
          <Badge variant="gold" size="sm" className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Live validation
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1.4fr_0.9fr]">
        <form className="space-y-5" onSubmit={form.handleSubmit(submitForm)} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Policy Name" required error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} placeholder="Treasury burn guard" />
            </FormField>

            <FormField
              label="Maximum Single Transaction Limit"
              required
              error={form.formState.errors.maxSingleTransactionLimit?.message}
            >
              <Input
                {...form.register('maxSingleTransactionLimit')}
                type="number"
                min={0.01}
                step="0.01"
                placeholder="2500"
              />
            </FormField>

            <FormField
              label="Rolling Budget Limit"
              required
              error={form.formState.errors.rollingBudgetLimit?.message}
            >
              <Input
                {...form.register('rollingBudgetLimit')}
                type="number"
                min={0.01}
                step="0.01"
                placeholder="20000"
              />
            </FormField>

            <FormField label="Budget Interval" required error={form.formState.errors.rollingBudgetInterval?.message}>
              <select
                {...form.register('rollingBudgetInterval')}
                className={cn(
                  'h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  form.formState.errors.rollingBudgetInterval && 'border-danger',
                )}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </FormField>
          </div>

          <FormField label="Whitelist Addresses" hint="Comma-separated Stellar G-addresses" error={form.formState.errors.whitelistAddresses?.message}>
            <Input {...form.register('whitelistAddresses')} placeholder="GABC...XYZ, GDEF...LMN" />
          </FormField>

          <FormField label="Allowed Assets" hint="Comma-separated asset codes" error={form.formState.errors.allowedAssets?.message}>
            <Input {...form.register('allowedAssets')} placeholder="XLM, USDC, EURC" />
          </FormField>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => form.reset()}>
              Reset
            </Button>
            <Button type="submit" variant="gold" leftIcon={<ShieldCheck className="h-4 w-4" aria-hidden />}>
              Validate policy
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-card border border-border bg-surface-secondary/30 p-4">
            <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-[0.18em] text-foreground-secondary">
              <WalletCards className="h-3.5 w-3.5" aria-hidden />
              JSON preview
            </div>
            <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-surface p-3 text-xs text-foreground">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  );
}
