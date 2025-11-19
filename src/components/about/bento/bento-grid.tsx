'use client';

import type { BentoData } from '@/types/bento-data';
import { CurrentMoodCard } from './current-mood-card';
import { GitHubActivityCard } from './github-activity-card';
import { MediaConsumedCard } from './media-consumed-card';
import { SteamGamingCard } from './steam-gaming-card';
import { TechStackCard } from './tech-stack-card';
import { HealthCard } from './health-card';
import { SubscriptionsCard } from './subscriptions-card';
import { ServerStatusCard } from './server-status-card';

interface BentoGridProps {
  data: BentoData;
}

/**
 * Bento Grid Layout
 * Responsive grid layout for all Bento cards
 */
export function BentoGrid({ data }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:auto-rows-[180px] md:grid-cols-4">
      {/* Row 1 */}
      <div className="md:col-span-1">
        <CurrentMoodCard data={data.mood} />
      </div>
      <div className="md:col-span-2">
        <GitHubActivityCard data={data.github} />
      </div>
      <div className="row-span-2 md:col-span-1">
        <MediaConsumedCard data={data.media} />
      </div>

      {/* Row 2 */}
      <div className="md:col-span-2">
        <SteamGamingCard data={data.steam} />
      </div>
      <div className="md:col-span-1">
        <TechStackCard data={data.stack} />
      </div>

      {/* Row 3 */}
      <div className="md:col-span-1">
        <HealthCard data={data.health} />
      </div>
      <div className="md:col-span-1">
        <SubscriptionsCard data={data.subscriptions} />
      </div>
      <div className="md:col-span-2">
        <ServerStatusCard data={data.server} />
      </div>
    </div>
  );
}
