import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  avatar?: string | null;
  cover?: string | null;
  description?: string | null;
  timestamp?: string;
  stats?: string;
  actions?: React.ReactNode;
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ className, name, avatar, cover, description, timestamp, stats, actions, ...props }, ref) => {
    // 默认图片 - 使用项目本地的 Christoph Nolte 摄影作品
    const defaultImage = "/images/default-profile.webp";
    const avatarUrl = avatar || defaultImage;
    const coverUrl = cover || avatar || defaultImage;

    return (
      <>
        <style>
          {`
            .profile-card-hover {
              transition: transform 700ms ease-out;
            }

            .profile-card-hover:hover {
              transform: scale(1.02);
            }

            .profile-card-image-scale {
              transition: transform 700ms ease-out;
            }

            .profile-card-image-container:hover .profile-card-image-scale {
              transform: scale(1.03);
            }

            .profile-card-translate {
              transition: transform 500ms ease-out;
            }

            .profile-card-translate:hover {
              transform: translateX(4px);
            }

            .profile-card-avatar-scale {
              transition: transform 500ms ease-out;
            }

            .profile-card-avatar-scale:hover {
              transform: scale(1.1);
            }
          `}
        </style>

        <div
          ref={ref}
          className={cn(
            "profile-card-hover rounded-3xl bg-white shadow-lg dark:bg-zinc-900 dark:shadow-2xl dark:shadow-black/80",
            className
          )}
          {...props}
        >
          {/* 头部图片区域 */}
          <div className="profile-card-image-container relative aspect-square overflow-hidden rounded-t-3xl">
            <Image
              src={coverUrl}
              alt={name}
              fill
              className="profile-card-image-scale object-cover"
              unoptimized
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 to-transparent dark:from-black/60" />
            <div className="absolute top-6 left-6">
              <h2 className="text-2xl font-medium text-white drop-shadow-lg">{name}</h2>
            </div>
          </div>

          {/* 信息栏 */}
          <div className="flex items-center justify-between p-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="profile-card-avatar-scale relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-zinc-700">
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={32}
                  height={32}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="profile-card-translate min-w-0 flex-1">
                <div className="truncate text-sm text-gray-700 dark:text-zinc-200">{name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                  {timestamp && <span>{timestamp}</span>}
                  {stats && (
                    <>
                      {timestamp && <span>•</span>}
                      <span>{stats}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {actions && <div className="ml-2 shrink-0">{actions}</div>}
          </div>

          {/* 描述区域（可选） */}
          {description && (
            <div className="px-4 pt-0 pb-4">
              <p className="line-clamp-2 text-sm text-gray-600 dark:text-zinc-400">{description}</p>
            </div>
          )}
        </div>
      </>
    );
  }
);

ProfileCard.displayName = "ProfileCard";

export { ProfileCard };
