"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Lock, Sparkles, Heart, Brain, Zap } from "lucide-react";
import Link from "next/link";

// Define translations locally for simplicity in this demo branch
const translations = {
    en: {
        hero: {
            title: "IntimDiary",
            subtitle: "Your personal space for intimate reflection and discovery.",
            description: "A secure, AI-powered diary designed to help you understand your intimate life, track your moods, and discover deeper insights about yourself.",
            cta: "Get Started",
            secondaryCta: "Learn More",
        },
        features: {
            ai: {
                title: "AI Insights",
                description: "Uncover patterns and receive personalized advice based on your entries.",
            },
            secure: {
                title: "Private & Secure",
                description: "Your data is encrypted locally. Only you hold the keys to your diary.",
            },
            analytics: {
                title: "Mood Analytics",
                description: "Visualize your emotional journey with beautiful, interactive charts.",
            },
        },
        stats: {
            users: "10k+ Users",
            entries: "500k+ Entries",
            rating: "4.9/5 Rating",
        },
    },
    zh: {
        hero: {
            title: "IntimDiary",
            subtitle: "您的私密反思与探索空间。",
            description: "一个安全、AI 驱动的日记应用，旨在帮助您了解您的亲密生活，追踪情绪，并发现关于自我的更深层见解。",
            cta: "开始使用",
            secondaryCta: "了解更多",
        },
        features: {
            ai: {
                title: "AI 洞察",
                description: "基于您的记录揭示模式并提供个性化建议。",
            },
            secure: {
                title: "隐私安全",
                description: "数据本地加密。只有您拥有日记的钥匙。",
            },
            analytics: {
                title: "情绪分析",
                description: "通过精美的交互式图表可视化您的情感旅程。",
            },
        },
        stats: {
            users: "10k+ 用户",
            entries: "50万+ 记录",
            rating: "4.9/5 评分",
        },
    },
};

type LandingPageProps = {
    locale: string;
};

export default function LandingPage({ locale }: LandingPageProps) {
    const t = translations[locale as keyof typeof translations] || translations.en;
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="h-full w-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 font-sans selection:bg-brand-100 selection:text-brand-900 overflow-hidden flex flex-col">

            {/* Hero Section - Flex-1 to take available space */}
            <section className="relative flex-1 flex flex-col justify-center min-h-0">
                {/* Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-200/30 blur-[100px] animate-pulse-ring" />
                    <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-200/20 blur-[80px] animate-float-slow" />
                    <div className="absolute top-[20%] left-[20%] w-[50px] h-[50px] rounded-full bg-yellow-200/40 blur-[40px] animate-orbit" />
                </div>

                <div className="container mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 h-full justify-center pt-20 pb-4 lg:pt-0 lg:pb-0">
                    <div className="flex-1 text-center lg:text-left flex flex-col justify-center shrink-0 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-1 duration-700 mx-auto lg:mx-0 w-fit">
                            <Sparkles size={14} className="animate-pulse" />
                            <span>Intelligent Pattern Recognition</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 leading-tight">
                            {t.hero.title}
                        </h1>

                        <p className="text-lg md:text-xl text-stone-600 dark:text-stone-300 font-light mb-8 max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 leading-relaxed">
                            {t.hero.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                            <button className="px-8 py-4 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-lg transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-1 flex items-center gap-2 group">
                                {t.hero.cta}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </button>
                            <button className="px-8 py-4 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 text-stone-700 dark:text-stone-200 font-medium text-lg transition-all hover:-translate-y-1">
                                {t.hero.secondaryCta}
                            </button>
                        </div>
                    </div>

                    {/* Hero Visual/Mockup Placeholder */}
                    <div className="flex-1 relative w-full max-w-md lg:max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500 shrink">
                        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-stone-200/50 dark:border-stone-700/50 bg-white/40 dark:bg-stone-900/40 backdrop-blur-md aspect-square lg:aspect-[4/3] flex items-center justify-center group animate-breathe">
                            {/* Abstract UI Representation */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-50/40 via-white/10 to-blue-50/40 dark:from-brand-950/20 dark:to-blue-950/20 transition-opacity duration-1000" />

                            <div className="relative z-10 text-center p-6 lg:p-10 scale-90 lg:scale-100 transition-transform duration-500 group-hover:scale-105">
                                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-brand-400 to-brand-600 rounded-3xl mx-auto mb-6 shadow-xl shadow-brand-500/20 rotate-12 group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center text-white animate-rock">
                                    <Heart size={48} fill="currentColor" className="text-white/90 animate-pulse" />
                                </div>
                                <h3 className="text-2xl lg:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2 tracking-tight">IntimDiary</h3>
                                <p className="text-sm lg:text-base text-stone-500 dark:text-stone-400 font-medium">Your private space for reflection.</p>
                            </div>

                            {/* Floating Cards with new Animations */}
                            <div className="absolute top-8 left-8 p-4 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 max-w-[220px] hidden lg:block animate-bob">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Brain size={16} /></div>
                                    <span className="font-semibold text-sm text-stone-800 dark:text-stone-200">Deep Insight</span>
                                </div>
                                <p className="text-xs text-stone-500 leading-snug">"You seem happier when you prioritize morning reflection."</p>
                            </div>

                            <div className="absolute bottom-10 right-8 p-4 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 max-w-[200px] hidden lg:block animate-thrust-y">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center"><Zap size={16} /></div>
                                    <span className="font-semibold text-sm text-stone-800 dark:text-stone-200">Mood Streak</span>
                                </div>
                                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full w-3/4 bg-brand-500 rounded-full animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simplified Features/Stats Bar for Slide Context - Fixed Height */}
            <section className="py-8 border-t border-stone-100 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md shrink-0">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12">
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 transition-colors group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30">
                                <Brain size={24} />
                            </div>
                            <div className="text-left overflow-hidden">
                                <div className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">{t.features.ai.title}</div>
                                <div className="text-xs text-stone-500 truncate group-hover:text-purple-600 transition-colors">Powered by Gemini</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30">
                                <Lock size={24} />
                            </div>
                            <div className="text-left overflow-hidden">
                                <div className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">{t.features.secure.title}</div>
                                <div className="text-xs text-stone-500 truncate group-hover:text-emerald-600 transition-colors">End-to-End Encrypted</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 transition-colors group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30">
                                <Sparkles size={24} />
                            </div>
                            <div className="text-left overflow-hidden">
                                <div className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">{t.features.analytics.title}</div>
                                <div className="text-xs text-stone-500 truncate group-hover:text-brand-600 transition-colors">Visual Trends</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center lg:justify-end">
                            <Link href="#" className="text-sm font-semibold text-stone-900 dark:text-stone-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2 group">
                                Visit IntimDiary <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="p-8 rounded-3xl bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group border border-transparent hover:border-stone-200 dark:hover:border-stone-700">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-stone-700 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-3">{title}</h3>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{description}</p>
        </div>
    );
}

function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <div className="text-4xl md:text-5xl font-bold text-brand-600 dark:text-brand-400 mb-2">{value}</div>
            <div className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">{label}</div>
        </div>
    );
}
