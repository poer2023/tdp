"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminTranslations } from "@/lib/admin-translations";
import type { AdminLocale } from "@/lib/admin-translations";
import { SUPPORTED_CURRENCIES } from "@/lib/subscription-shared";

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
    });
  };

  const handleCancel = () => {
    router.push("/admin/subscriptions");
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {isEditing ? translation("editSubscription") : translation("addSubscription")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {translation("subscriptionManagement")}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {translation("subscriptionName")}
          </span>
          <input
            required
            name="name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
            placeholder="Netflix, GitHub, Adobe..."
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {translation("billingCycle")}
          </span>
          <select
            name="billingCycle"
            value={form.billingCycle}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                billingCycle: event.target.value as BillingCycle,
              }))
            }
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
          >
            {billingCycleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {translation("currency")}
          </span>
          <select
            name="currency"
            value={form.currency}
            onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {translation("originalAmount")}
          </span>
          <input
            required
            name="amount"
            inputMode="decimal"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
            placeholder="0.00"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {translation("startDate")}
          </span>
          <input
            required
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {translation("endDate")}
          </span>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {translation("notes")}
        </span>
        <textarea
          name="notes"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500"
          rows={3}
          placeholder="Remarks, renewal reminders, account info..."
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? `${translation("saveChanges")}...` : translation("saveChanges")}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {translation("cancel")}
        </button>
      </div>
    </form>
  );
}
