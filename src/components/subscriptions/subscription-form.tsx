"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminTranslations } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import { SUPPORTED_CURRENCIES } from "@/lib/subscription-shared";
import { Card, Button, Input, Select, Textarea, Alert } from "@/components/ui-heroui";

type BillingCycle = "MONTHLY" | "ANNUAL" | "ONE_TIME";

type FormState = {
  id: string | null;
  name: string;
  currency: string;
  amount: string;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string;
  notes: string;
};

const billingCycleOptions: { value: BillingCycle; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "ONE_TIME", label: "One-time" },
];

const INITIAL_FORM: FormState = {
  id: null,
  name: "",
  currency: "CNY",
  amount: "",
  billingCycle: "MONTHLY",
  startDate: "",
  endDate: "",
  notes: "",
};

function translate(locale: AdminLocale, key: keyof typeof adminTranslations.en) {
  return adminTranslations[locale][key];
}

type SubscriptionFormProps = {
  locale: AdminLocale;
  initialData?: FormState;
  onSuccess?: () => void;
};

export function SubscriptionForm({ locale, initialData, onSuccess }: SubscriptionFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialData || INITIAL_FORM);
  const [isSubmitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(form.id);
  const translation = (key: keyof typeof adminTranslations.en) => translate(locale, key);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      currency: form.currency,
      amount: form.amount,
      billingCycle: form.billingCycle,
      startDate: form.startDate,
      endDate: form.endDate || null,
      notes: form.notes,
    };

    if (!payload.name || !payload.amount || !payload.startDate) {
      setError("Please complete all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        const endpoint = form.id ? `/api/subscriptions/${form.id}` : "/api/subscriptions";
        const method = form.id ? "PUT" : "POST";

        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(data.error ?? "Failed to save subscription.");
          return;
        }

        router.push("/admin/subscriptions");
        router.refresh();

        if (onSuccess) {
          onSuccess();
        }
      } catch (submissionError) {
        setError("Network error. Please try again.");
        console.error("Failed to submit subscription:", submissionError);
      }
    });
  };

  const handleCancel = () => {
    router.push("/admin/subscriptions");
  };

  return (
    <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
      <form onSubmit={handleSubmit} noValidate className="space-y-5 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
            {translation("subscriptionManagement")}
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {isEditing ? translation("editSubscription") : translation("addSubscription")}
          </h2>
        </div>

        {error && <Alert status="danger" description={error} />}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={translation("subscriptionName")}
            name="name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            isRequired
            placeholder="Netflix, GitHub, Adobe..."
          />

          <Select
            label={translation("billingCycle")}
            value={form.billingCycle}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                billingCycle: value as BillingCycle,
              }))
            }
          >
            {billingCycleOptions.map((option) => (
              <Select.Item key={option.value} id={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select>

          <Select
            label={translation("currency")}
            value={form.currency}
            onChange={(value) => setForm((prev) => ({ ...prev, currency: value }))}
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <Select.Item key={currency} id={currency}>
                {currency}
              </Select.Item>
            ))}
          </Select>

          <Input
            label={translation("originalAmount")}
            name="amount"
            inputMode="decimal"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            isRequired
            placeholder="0.00"
          />

          <Input
            label={translation("startDate")}
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            isRequired
          />

          <Input
            label={translation("endDate")}
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
          />
        </div>

        <Textarea
          label={translation("notes")}
          name="notes"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          rows={3}
          placeholder="Remarks, renewal reminders, account info..."
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button color="primary" type="submit" isDisabled={isSubmitting}>
            {isSubmitting ? `${translation("saveChanges")}...` : translation("saveChanges")}
          </Button>
          <Button variant="light" type="button" onPress={handleCancel}>
            {translation("cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
