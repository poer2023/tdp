"use client";

import React, { useState } from 'react';
import { CreditCard, Edit2, Trash2 } from 'lucide-react';
import { useData } from './store';
import type { Subscription } from './types';
import {
    SectionContainer, ListContainer, EditForm, Input, ActionBtn
} from './AdminComponents';

export const SubscriptionsSection: React.FC = () => {
    const { subscriptions, addSubscription, updateSubscription, deleteSubscription, convertCurrency } = useData();
    const [editingSubscription, setEditingSubscription] = useState<Partial<Subscription> | null>(null);

    const handleSaveSubscription = () => {
        if (!editingSubscription?.name) return;
        const startDate = editingSubscription.startDate || new Date().toISOString();
        const endDate = editingSubscription.active === false
            ? (editingSubscription.endDate ?? new Date().toISOString())
            : editingSubscription.endDate ?? null;
        const subData = {
            ...editingSubscription,
            id: editingSubscription.id || Math.random().toString(36).substr(2, 9),
            active: editingSubscription.active ?? true,
            currency: editingSubscription.currency || 'CNY',
            cycle: editingSubscription.cycle || 'monthly',
            category: editingSubscription.category || 'General',
            price: Number(editingSubscription.price) || 0,
            startDate,
            endDate
        } as Subscription;

        if (editingSubscription.id) updateSubscription(subData);
        else addSubscription(subData);
        setEditingSubscription(null);
    };

    return (
        <SectionContainer title="Subscriptions" onAdd={() => setEditingSubscription({})}>
            {editingSubscription ? (
                <EditForm title={editingSubscription.id ? 'Edit Subscription' : 'New Subscription'} onSave={handleSaveSubscription} onCancel={() => setEditingSubscription(null)}>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Service Name" value={editingSubscription.name || ''} onChange={v => setEditingSubscription({ ...editingSubscription, name: v })} />
                        <Input label="Category" value={editingSubscription.category || ''} onChange={v => setEditingSubscription({ ...editingSubscription, category: v })} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Price" type="number" value={editingSubscription.price?.toString() || ''} onChange={v => setEditingSubscription({ ...editingSubscription, price: Number(v) })} />
                        <Input label="Currency" value={editingSubscription.currency || ''} onChange={v => setEditingSubscription({ ...editingSubscription, currency: v as any })} />
                        <Input label="Cycle" value={editingSubscription.cycle || ''} onChange={v => setEditingSubscription({ ...editingSubscription, cycle: v as any })} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={editingSubscription.active || false} onChange={e => setEditingSubscription({ ...editingSubscription, active: e.target.checked })} />
                        <label className="text-sm">Active Subscription</label>
                    </div>
                </EditForm>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                            <div className="text-xs text-stone-500 uppercase font-bold mb-1">Monthly Total</div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                ¥{subscriptions.filter(s => s.active && s.cycle === 'monthly').reduce((acc, s) => acc + convertCurrency(s.price, s.currency), 0).toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
                            <div className="text-xs text-stone-500 uppercase font-bold mb-1">Yearly Total</div>
                            <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                ¥{subscriptions.filter(s => s.active).reduce((acc, s) => {
                                    const monthly = s.cycle === 'monthly' ? s.price : s.price / 12;
                                    return acc + convertCurrency(monthly * 12, s.currency);
                                }, 0).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <ListContainer>
                        {subscriptions.map(s => (
                            <div key={s.id} className={`bg-white dark:bg-stone-900 p-4 rounded-xl border ${s.active ? 'border-stone-200 dark:border-stone-800' : 'border-stone-100 dark:border-stone-800 opacity-60'} flex items-center justify-between`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${s.active ? 'bg-stone-100 dark:bg-stone-800 text-stone-600' : 'bg-stone-50 text-stone-400'}`}>
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-900 dark:text-stone-100">{s.name}</h3>
                                        <p className="text-xs text-stone-500">{s.category} • {s.cycle}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="font-bold text-stone-900 dark:text-stone-100">{s.currency} {s.price}</div>
                                    <div className="text-xs text-stone-400">≈ ¥{convertCurrency(s.price, s.currency).toFixed(0)}</div>
                                </div>
                                <div className="flex gap-2">
                                    <ActionBtn onClick={() => setEditingSubscription(s)} icon={<Edit2 size={16} />} />
                                    <ActionBtn onClick={() => void deleteSubscription(s.id)} icon={<Trash2 size={16} />} danger />
                                </div>
                            </div>
                        </div>
                    ))}
                    </ListContainer>
                </div>
            )}
        </SectionContainer>
    );
};

export default SubscriptionsSection;
