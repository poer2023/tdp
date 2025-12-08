"use client";

import React from 'react';
import { useData } from './store';
import { TrafficStatsSection } from './AdminComponents';

export const AnalyticsSection: React.FC = () => {
    const { trafficData, sourceData, pageVisitData, deviceData } = useData();

    return (
        <TrafficStatsSection
            trafficData={trafficData}
            sourceData={sourceData}
            pageVisitData={pageVisitData}
            deviceData={deviceData}
        />
    );
};

export default AnalyticsSection;
