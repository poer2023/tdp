"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Link as LinkIcon, Loader2 } from "lucide-react";
import "@/styles/tiptap-editor.css";

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    onImageUpload?: (file: File) => Promise<string>;
    autoSaveKey?: string;
    className?: string;
}

export function TiptapEditor({
    content,
    onChange,
    placeholder = "Start writing...",
    onImageUpload,
    autoSaveKey,
    className = "",
}: TiptapEditorProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [showDraftRestore, setShowDraftRestore] = useState(false);
    const [draftContent, setDraftContent] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const savedIndicatorRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-blue-600 underline hover:text-blue-800",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: "focus:outline-none",
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);

            // Auto-save with debounce
            if (autoSaveKey) {
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
                saveTimeoutRef.current = setTimeout(() => {
                    localStorage.setItem(
                        autoSaveKey,
                        JSON.stringify({
                            content: html,
                            timestamp: Date.now(),
                        })
                    );
                    // Show saved indicator
                    setIsSaved(true);
                    if (savedIndicatorRef.current) {
                        clearTimeout(savedIndicatorRef.current);
                    }
                    savedIndicatorRef.current = setTimeout(() => {
                        setIsSaved(false);
                    }, 2000);
                }, 2000);
            }
        },
        // Performance optimization
        immediatelyRender: false,
    });

    // Check for draft on mount
    useEffect(() => {
        if (autoSaveKey && editor) {
            const saved = localStorage.getItem(autoSaveKey);
            if (saved) {
                try {
                    const { content: savedContent, timestamp } = JSON.parse(saved);
                    // Only show restore if draft is newer than 24 hours and different from current
                    if (Date.now() - timestamp < 24 * 60 * 60 * 1000 && savedContent !== content) {
                        setDraftContent(savedContent);
                        setShowDraftRestore(true);
                    }
                } catch {
                    // Invalid saved data
                }
            }
        }
    }, [autoSaveKey, editor, content]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleRestoreDraft = useCallback(() => {
        if (draftContent && editor) {
            editor.commands.setContent(draftContent);
            onChange(draftContent);
        }
        setShowDraftRestore(false);
        setDraftContent(null);
    }, [draftContent, editor, onChange]);

    const handleDiscardDraft = useCallback(() => {
        if (autoSaveKey) {
            localStorage.removeItem(autoSaveKey);
        }
        setShowDraftRestore(false);
        setDraftContent(null);
    }, [autoSaveKey]);

    const handleImageUpload = useCallback(
        async (file: File) => {
            if (!onImageUpload || !editor) return;

            setIsUploading(true);
            try {
                const url = await onImageUpload(file);
                editor.chain().focus().setImage({ src: url }).run();
            } catch (error) {
                console.error("Image upload failed:", error);
            } finally {
                setIsUploading(false);
            }
        },
        [editor, onImageUpload]
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleImageUpload(file);
            }
            e.target.value = "";
        },
        [handleImageUpload]
    );

    const insertLink = useCallback(() => {
        if (!editor) return;
        const url = window.prompt("Enter URL:");
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    if (!editor) {
        return (
            <div className="border rounded-lg bg-stone-50 dark:bg-stone-800 min-h-[300px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
        );
    }

    return (
        <div className={`border rounded-lg overflow-hidden bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 ${className}`}>
            {/* Draft restore banner */}
            {showDraftRestore && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-amber-800 dark:text-amber-200">
                        Found unsaved draft. Restore it?
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRestoreDraft}
                            className="px-3 py-1 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700"
                        >
                            Restore
                        </button>
                        <button
                            onClick={handleDiscardDraft}
                            className="px-3 py-1 text-xs font-medium text-amber-600 hover:text-amber-800"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="border-b border-stone-200 dark:border-stone-700 px-2 py-1 flex items-center gap-1 bg-stone-50 dark:bg-stone-800">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 ${editor.isActive("bold") ? "bg-stone-200 dark:bg-stone-700" : ""
                        }`}
                    title="Bold"
                >
                    <span className="font-bold text-sm">B</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 ${editor.isActive("italic") ? "bg-stone-200 dark:bg-stone-700" : ""
                        }`}
                    title="Italic"
                >
                    <span className="italic text-sm">I</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 ${editor.isActive("heading", { level: 1 }) ? "bg-stone-200 dark:bg-stone-700" : ""
                        }`}
                    title="Heading 1"
                >
                    <span className="text-sm font-bold">H1</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 ${editor.isActive("heading", { level: 2 }) ? "bg-stone-200 dark:bg-stone-700" : ""
                        }`}
                    title="Heading 2"
                >
                    <span className="text-sm font-bold">H2</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 ${editor.isActive("bulletList") ? "bg-stone-200 dark:bg-stone-700" : ""
                        }`}
                    title="Bullet List"
                >
                    <span className="text-sm">•</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 ${editor.isActive("codeBlock") ? "bg-stone-200 dark:bg-stone-700" : ""
                        }`}
                    title="Code Block"
                >
                    <span className="text-sm font-mono">&lt;/&gt;</span>
                </button>
                <button
                    onClick={insertLink}
                    className={`p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 ${editor.isActive("link") ? "bg-stone-200 dark:bg-stone-700" : ""
                        }`}
                    title="Insert Link"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>

                {onImageUpload && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50"
                            title="Insert Image"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ImageIcon className="w-4 h-4" />
                            )}
                        </button>
                    </>
                )}

                {/* Auto-save indicator */}
                {autoSaveKey && (
                    <div className="ml-auto flex items-center text-xs text-stone-400">
                        {isSaved && (
                            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Saved
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Editor content */}
            <EditorContent editor={editor} />
        </div>
    );
}

export default TiptapEditor;
