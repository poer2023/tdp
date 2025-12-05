"use client";

import React, { useState } from 'react';
import { useData } from './store';
import type { ShareItem } from './types';
import {
    SectionContainer, ListContainer, ListItem, EditForm, Input, TextArea
} from './AdminComponents';
import { useAdminLocale } from './useAdminLocale';

export const CuratedSection: React.FC = () => {
    const { shareItems, addShareItem, updateShareItem, deleteShareItem } = useData();
    const { t } = useAdminLocale();
    const [editingShare, setEditingShare] = useState<Partial<ShareItem> | null>(null);

    const handleDelete = async (id: string) => {
        try {
            await deleteShareItem(id);
        } catch (error) {
            console.error('Failed to delete curated item:', error);
        }
    };

    const handleSaveShare = async () => {
        if (!editingShare?.title) return;
        const shareData = {
            ...editingShare,
            id: editingShare.id || Math.random().toString(36).substr(2, 9),
            date: editingShare.date || 'Just now',
            likes: editingShare.likes || 0,
            type: 'share' as const
        } as ShareItem;

        try {
            if (editingShare.id) {
                await updateShareItem(shareData);
            } else {
                await addShareItem(shareData);
            }
            setEditingShare(null);
        } catch (error) {
            console.error('Failed to save curated item:', error);
        }
    };

    return (
        <SectionContainer title={t('curatedLinks')} onAdd={() => setEditingShare({})}>
            {editingShare ? (
                <EditForm title={editingShare.id ? t('editCurated') : t('newCurated')} onSave={handleSaveShare} onCancel={() => setEditingShare(null)}>
                    <Input label={t('title')} value={editingShare.title} onChange={v => setEditingShare({ ...editingShare, title: v })} />
                    <Input label={t('url')} value={editingShare.url} onChange={v => setEditingShare({ ...editingShare, url: v })} />
                    <TextArea label={t('description')} value={editingShare.description} onChange={v => setEditingShare({ ...editingShare, description: v })} />
                    <Input label={t('domainOptional')} value={editingShare.domain} onChange={v => setEditingShare({ ...editingShare, domain: v })} />
                    <Input label={t('imageUrlOptional')} value={editingShare.imageUrl} onChange={v => setEditingShare({ ...editingShare, imageUrl: v })} />
                    <Input label={t('tags')} value={editingShare.tags?.join(', ')} onChange={v => setEditingShare({ ...editingShare, tags: v.split(',').map(s => s.trim()) })} />
                </EditForm>
            ) : (
                <ListContainer>
                    {shareItems.map(s => (
                        <ListItem key={s.id} title={s.title} subtitle={s.domain} onEdit={() => setEditingShare(s)} onDelete={() => handleDelete(s.id)} />
                    ))}
                </ListContainer>
            )}
        </SectionContainer>
    );
};

export default CuratedSection;
