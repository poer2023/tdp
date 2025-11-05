import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  avatar?: string | null;
  description?: string | null;
  timestamp?: string;
  stats?: string;
  actions?: React.ReactNode;
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ className, name, avatar, description, timestamp, stats, actions, ...props }, ref) => {
    // 默认头像
    const defaultAvatar = "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg";
    const avatarUrl = avatar || defaultAvatar;

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
            "bg-white dark:bg-zinc-900 rounded-3xl shadow-lg dark:shadow-2xl dark:shadow-black/80 overflow-hidden profile-card-hover",
            className
          )}
          {...props}
        >
          {/* 头部图片区域 */}
          <div className="relative overflow-hidden profile-card-image-container">
            <img
              src={avatarUrl}
              alt={name}
              className="w-full aspect-square object-cover profile-card-image-scale"
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/30 dark:from-black/60 to-transparent pointer-events-none" />
            <div className="absolute top-6 left-6">
              <h2 className="text-2xl font-medium text-white drop-shadow-lg">{name}</h2>
            </div>
          </div>

          {/* 信息栏 */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden profile-card-avatar-scale ring-2 ring-gray-200 dark:ring-zinc-700 shrink-0">
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              </div>
              <div className="profile-card-translate flex-1 min-w-0">
                <div className="text-sm text-gray-700 dark:text-zinc-200 truncate">{name}</div>
                <div className="text-xs text-gray-500 dark:text-zinc-500 flex items-center gap-2">
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
            <div className="px-4 pb-4 pt-0">
              <p className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">
                {description}
              </p>
            </div>
          )}
        </div>
      </>
    );
  }
);

ProfileCard.displayName = "ProfileCard";

export { ProfileCard };
