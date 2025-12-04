
import React, { useState, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/HomePage';
import Footer from './components/Footer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import { DataProvider, AuthProvider, SettingsProvider, useAuth } from './store';
import SEO from './components/SEO';

// Lazy load heavy components for performance
const Gallery = React.lazy(() => import('./components/Gallery'));
const StatsDashboard = React.lazy(() => import('./components/StatsDashboard'));
const Projects = React.lazy(() => import('./components/Projects'));
const FriendConnect = React.lazy(() => import('./components/FriendConnect'));
const FriendRoom = React.lazy(() => import('./components/FriendRoom'));

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-sage-500 rounded-full animate-spin"></div>
    </div>
);

// Protected Route for Admin
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// Main Content Wrapper to handle Layout consistency
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    // Login, Dashboard, and Connect pages have their own dedicated layouts
    const hiddenLayoutPaths = ['/login', '/dashboard', '/connect', '/friends/'];
    if (hiddenLayoutPaths.some(path => location.pathname.startsWith(path))) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col font-sans text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-950 selection:bg-sage-100 dark:selection:bg-sage-900 selection:text-sage-900 dark:selection:text-sage-200 transition-colors duration-300">
            <Header />
            <main className="flex-grow w-full">
                <Suspense fallback={<LoadingSpinner />}>
                    {children}
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

// Router Setup
const AppRoutes = () => {
    return (
        <MainLayout>
             <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/gallery" element={
                    <>
                        <SEO title="Gallery" description="Visual stories through photography and motion." />
                        <Gallery />
                    </>
                } />
                <Route path="/projects" element={
                    <>
                        <SEO title="Projects" description="A collection of my digital creations and experiments." />
                        <Projects />
                    </>
                } />
                <Route path="/data" element={
                    <>
                         <SEO title="My Data" description="Quantified self data: movies, games, and skills." />
                         <StatsDashboard />
                    </>
                } />
                
                {/* Friend Routes */}
                <Route path="/connect" element={<FriendConnect />} />
                <Route path="/friends/:code" element={<FriendRoom />} />
                
                {/* Admin Dashboard Route */}
                <Route path="/dashboard" element={
                    <ProtectedAdminRoute>
                        <SEO title="CMS" description="Content Management System" />
                        <AdminDashboard />
                    </ProtectedAdminRoute>
                } />

                {/* Fallback to Home */}
                <Route path="*" element={<HomePage />} />
             </Routes>
        </MainLayout>
    );
};

function App() {
    return (
        <HashRouter>
            <SettingsProvider>
                <AuthProvider>
                    <DataProvider>
                        <AppRoutes />
                    </DataProvider>
                </AuthProvider>
            </SettingsProvider>
        </HashRouter>
    )
}

export default App;
