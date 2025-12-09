"use client";

import React, { useState, useCallback } from 'react';
import { Layers, Database, Save, RotateCcw } from 'lucide-react';
import { useData } from './store';
import { DataSection, Input } from './AdminComponents';
import { SimpleToast } from './Toast';
import { useAdminLocale } from './useAdminLocale';

export const LifeDataSection: React.FC = () => {
    const {
        movieData, gameData, skillData, photoStats, routineData, stepsData,
        updateMovieData, updateGameData, updateSkillData, updatePhotoStats, updateRoutineData, updateStepsData,
        saveLifeData, refreshLifeData, loading
    } = useData();
    const { t } = useAdminLocale();

    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveLifeData();
            showToast(t('dataSaved'), 'success');
        } catch (error) {
            console.error('Failed to save life data:', error);
            showToast(t('failedToSave'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshLifeData();
            showToast(t('dataRefreshed'), 'success');
        } catch {
            showToast(t('failedToSave'), 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20 space-y-8">
            {/* Toast Notification */}
            {toast && <SimpleToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{t('lifeDataTitle')}</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || loading.lifeData}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg font-medium hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RotateCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        {t('refresh')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || loading.lifeData}
                        className="flex items-center gap-2 px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isSaving ? (
                            <RotateCcw size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {isSaving ? t('saving') : t('saveChanges')}
                    </button>
                </div>
            </div>

            <DataSection title={t('skills')} icon={<Layers size={18} />}>
                <div className="space-y-3">
                    {skillData.map((skill, idx) => (
                        <div key={idx} className="flex gap-2">
                            <Input value={skill.name} onChange={v => { const n = [...skillData]; if (n[idx]) { n[idx].name = v; updateSkillData(n); } }} />
                            <div className="w-24"><Input type="number" value={skill.level.toString()} onChange={v => { const n = [...skillData]; if (n[idx]) { n[idx].level = Number(v); updateSkillData(n); } }} /></div>
                        </div>
                    ))}
                </div>
            </DataSection>

            <DataSection title={t('gameStatsRadar')} icon={<Database size={18} />}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {gameData.map((g, idx) => (
                        <div key={idx} className="p-3 border rounded bg-stone-50 dark:bg-stone-900 dark:border-stone-800">
                            <div className="text-xs font-bold mb-2 text-stone-500">{g.subject}</div>
                            <Input type="number" label={t('value')} value={g.A.toString()} onChange={v => { const n = [...gameData]; if (n[idx]) { n[idx].A = Number(v); updateGameData(n); } }} />
                        </div>
                    ))}
                </div>
            </DataSection>

            <DataSection title={t('weeklyRoutinePie')} icon={<Database size={18} />}>
                <div className="space-y-3">
                    {routineData.map((r, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <div className="w-6 h-6 rounded border border-stone-200" style={{ backgroundColor: r.color }}></div>
                            <Input value={r.name} onChange={v => { const n = [...routineData]; if (n[idx]) { n[idx].name = v; updateRoutineData(n); } }} />
                            <div className="w-24"><Input type="number" value={r.value.toString()} onChange={v => { const n = [...routineData]; if (n[idx]) { n[idx].value = Number(v); updateRoutineData(n); } }} /></div>
                        </div>
                    ))}
                </div>
            </DataSection>

            <DataSection title={t('dailySteps')} icon={<Database size={18} />}>
                <div className="grid grid-cols-7 gap-2">
                    {stepsData.map((s, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-xs mb-1 text-stone-500">{s.day}</div>
                            <Input type="number" value={s.steps.toString()} onChange={v => { const n = [...stepsData]; if (n[idx]) { n[idx].steps = Number(v); updateStepsData(n); } }} />
                        </div>
                    ))}
                </div>
            </DataSection>

            <DataSection title={t('photoStatsTitle')} icon={<Database size={18} />}>
                <div className="grid grid-cols-7 gap-2">
                    {photoStats.map((s, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-xs mb-1 text-stone-500">{s.day}</div>
                            <Input type="number" value={s.count.toString()} onChange={v => { const n = [...photoStats]; if (n[idx]) { n[idx].count = Number(v); updatePhotoStats(n); } }} />
                        </div>
                    ))}
                </div>
            </DataSection>

            <DataSection title={t('moviesSeries')} icon={<Database size={18} />}>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {movieData.map((m, idx) => (
                        <div key={idx} className="text-center p-2 border rounded dark:border-stone-800">
                            <div className="text-xs font-bold mb-2">{m.month}</div>
                            <div className="space-y-1">
                                <Input type="number" label="Mov" value={m.movies.toString()} onChange={v => { const n = [...movieData]; if (n[idx]) { n[idx].movies = Number(v); updateMovieData(n); } }} />
                                <Input type="number" label="Ser" value={m.series.toString()} onChange={v => { const n = [...movieData]; if (n[idx]) { n[idx].series = Number(v); updateMovieData(n); } }} />
                            </div>
                        </div>
                    ))}
                </div>
            </DataSection>
        </div>
    );
};

export default LifeDataSection;
