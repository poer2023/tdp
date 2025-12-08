"use client";

import React, { useState } from 'react';
import { useData } from './store';
import type { Project } from './types';
import {
    SectionContainer, ListContainer, ListItem, EditForm, Input, TextArea
} from './AdminComponents';
import { useAdminLocale } from './useAdminLocale';

export const ProjectsSection: React.FC = () => {
    const { projects, addProject, updateProject, deleteProject } = useData();
    const { t } = useAdminLocale();
    const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);

    const handleDelete = async (id: string) => {
        try {
            await deleteProject(id);
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };

    const handleSaveProject = async () => {
        if (!editingProject?.title) return;
        const projectData = {
            ...editingProject,
            id: editingProject.id || Math.random().toString(36).substr(2, 9),
            technologies: editingProject.technologies || [],
            features: editingProject.features || []
        } as Project;

        try {
            if (editingProject.id) {
                await updateProject(projectData);
            } else {
                await addProject(projectData);
            }
            setEditingProject(null);
        } catch (error) {
            console.error('Failed to save project:', error);
        }
    };

    return (
        <SectionContainer title={t('projectsTitle')} onAdd={() => setEditingProject({})}>
            {editingProject ? (
                <EditForm title={editingProject.id ? t('editProject') : t('newProject')} onSave={handleSaveProject} onCancel={() => setEditingProject(null)}>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('title')} value={editingProject.title} onChange={v => setEditingProject({ ...editingProject, title: v })} />
                        <Input label={t('role')} value={editingProject.role} onChange={v => setEditingProject({ ...editingProject, role: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('year')} value={editingProject.year} onChange={v => setEditingProject({ ...editingProject, year: v })} />
                        <Input label={t('date')} value={editingProject.date} onChange={v => setEditingProject({ ...editingProject, date: v })} />
                    </div>
                    <TextArea label={t('description')} value={editingProject.description} onChange={v => setEditingProject({ ...editingProject, description: v })} />
                    <Input label={t('imageUrl')} value={editingProject.imageUrl} onChange={v => setEditingProject({ ...editingProject, imageUrl: v })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('demoUrl')} value={editingProject.demoUrl} onChange={v => setEditingProject({ ...editingProject, demoUrl: v })} />
                        <Input label={t('repoUrl')} value={editingProject.repoUrl} onChange={v => setEditingProject({ ...editingProject, repoUrl: v })} />
                    </div>
                    <Input label={t('technologiesCommaSeparated')} value={editingProject.technologies?.join(', ')} onChange={v => setEditingProject({ ...editingProject, technologies: v.split(',').map(s => s.trim()) })} />
                    <Input label={t('featuresCommaSeparated')} value={editingProject.features?.join(', ')} onChange={v => setEditingProject({ ...editingProject, features: v.split(',').map(s => s.trim()) })} />
                </EditForm>
            ) : (
                <ListContainer>
                    {projects.map(p => (
                        <ListItem key={p.id} title={p.title} subtitle={p.role} onEdit={() => setEditingProject(p)} onDelete={() => handleDelete(p.id)} image={p.imageUrl} />
                    ))}
                </ListContainer>
            )}
        </SectionContainer>
    );
};

export default ProjectsSection;
