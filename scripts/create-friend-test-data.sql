-- ============================================================================
-- Friend 功能测试数据创建脚本
-- 目的：创建测试 Friends 和关联的 Moments 用于功能验证
-- ============================================================================

-- 注意：Friend 密码需要通过管理员界面创建以生成 bcrypt 哈希
-- 本脚本只创建 Moments 数据，Friends 请通过 UI 创建

-- 步骤 1：先通过管理员界面创建以下 Friends
-- - Name: Alice, Slug: alice
-- - Name: Bob, Slug: bob
-- - Name: Carol, Slug: carol

-- 步骤 2：获取创建的 Friend IDs
-- 执行此查询获取 Friend IDs：
-- SELECT id, name, slug FROM "Friend" ORDER BY "createdAt" DESC LIMIT 3;

-- 步骤 3：替换下面的 Friend IDs
-- 将 'REPLACE_WITH_ALICE_ID', 'REPLACE_WITH_BOB_ID', 'REPLACE_WITH_CAROL_ID'
-- 替换为实际的 Friend IDs

-- ============================================================================
-- 为 Alice 创建专属 Moments
-- ============================================================================

-- Alice 专属 Moment 1：生日聚会
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_alice_birthday_' || gen_random_uuid()::text,
  'alice-birthday-party-' || extract(epoch from now())::text,
  '🎂 Alice，生日快乐！还记得我们一起度过的那个难忘的生日派对吗？',
  '[]'::jsonb,
  now() - interval '2 days',
  now() - interval '2 days',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'ZH',
  'FRIEND_ONLY',
  'REPLACE_WITH_ALICE_ID',
  now() - interval '2 days'
);

-- Alice 专属 Moment 2：咖啡时光
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_alice_coffee_' || gen_random_uuid()::text,
  'alice-coffee-time-' || extract(epoch from now())::text,
  '☕️ 想起我们常去的那家咖啡店，Alice 最爱点焦糖玛奇朵。下次见面一起再去吧！',
  '[]'::jsonb,
  now() - interval '5 days',
  now() - interval '5 days',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'ZH',
  'FRIEND_ONLY',
  'REPLACE_WITH_ALICE_ID',
  now() - interval '5 days'
);

-- Alice 专属 Moment 3：旅行回忆
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_alice_travel_' || gen_random_uuid()::text,
  'alice-travel-memory-' || extract(epoch from now())::text,
  '✈️ Alice, remember our trip to Kyoto? The cherry blossoms were beautiful!',
  '[]'::jsonb,
  now() - interval '10 days',
  now() - interval '10 days',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'EN',
  'FRIEND_ONLY',
  'REPLACE_WITH_ALICE_ID',
  now() - interval '10 days'
);

-- ============================================================================
-- 为 Bob 创建专属 Moments
-- ============================================================================

-- Bob 专属 Moment 1：篮球比赛
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_bob_basketball_' || gen_random_uuid()::text,
  'bob-basketball-game-' || extract(epoch from now())::text,
  '🏀 Bob，上次篮球赛你的三分球太帅了！什么时候再来一场？',
  '[]'::jsonb,
  now() - interval '3 days',
  now() - interval '3 days',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'ZH',
  'FRIEND_ONLY',
  'REPLACE_WITH_BOB_ID',
  now() - interval '3 days'
);

-- Bob 专属 Moment 2：游戏时光
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_bob_gaming_' || gen_random_uuid()::text,
  'bob-gaming-night-' || extract(epoch from now())::text,
  '🎮 Bob, let''s play that new game tonight! I finally got my controller fixed.',
  '[]'::jsonb,
  now() - interval '7 days',
  now() - interval '7 days',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'EN',
  'FRIEND_ONLY',
  'REPLACE_WITH_BOB_ID',
  now() - interval '7 days'
);

-- ============================================================================
-- 为 Carol 创建专属 Moments
-- ============================================================================

-- Carol 专属 Moment 1：读书分享
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_carol_books_' || gen_random_uuid()::text,
  'carol-book-sharing-' || extract(epoch from now())::text,
  '📚 Carol，你推荐的那本书我看完了，太棒了！我们的读书会什么时候开始？',
  '[]'::jsonb,
  now() - interval '1 day',
  now() - interval '1 day',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'ZH',
  'FRIEND_ONLY',
  'REPLACE_WITH_CAROL_ID',
  now() - interval '1 day'
);

-- Carol 专属 Moment 2：音乐会
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_carol_concert_' || gen_random_uuid()::text,
  'carol-concert-night-' || extract(epoch from now())::text,
  '🎵 Carol, the concert last night was amazing! Thanks for getting the tickets!',
  '[]'::jsonb,
  now() - interval '4 days',
  now() - interval '4 days',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'EN',
  'FRIEND_ONLY',
  'REPLACE_WITH_CAROL_ID',
  now() - interval '4 days'
);

-- ============================================================================
-- 创建一些 PUBLIC Moments（所有 Friends 都能看到）
-- ============================================================================

-- 公开 Moment 1：新年快乐
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_public_newyear_' || gen_random_uuid()::text,
  'happy-new-year-' || extract(epoch from now())::text,
  '🎉 新年快乐！祝所有朋友们新年愉快，万事如意！',
  '[]'::jsonb,
  now() - interval '15 days',
  now() - interval '15 days',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'ZH',
  'PUBLIC',
  NULL,
  now() - interval '15 days'
);

-- 公开 Moment 2：周末分享
INSERT INTO "Moment" (
  id,
  slug,
  content,
  images,
  "createdAt",
  "updatedAt",
  visibility,
  status,
  "authorId",
  lang,
  "friendVisibility",
  "friendId",
  "happenedAt"
) VALUES (
  'moment_public_weekend_' || gen_random_uuid()::text,
  'weekend-vibes-' || extract(epoch from now())::text,
  '🌟 Weekend vibes! Hope everyone is having a great time!',
  '[]'::jsonb,
  now() - interval '6 days',
  now() - interval '6 days',
  'PUBLIC',
  'PUBLISHED',
  NULL,
  'EN',
  'PUBLIC',
  NULL,
  now() - interval '6 days'
);

-- ============================================================================
-- 验证查询
-- ============================================================================

-- 查询所有 Friends
-- SELECT id, name, slug, "createdAt" FROM "Friend" ORDER BY "createdAt" DESC;

-- 查询 Alice 的专属 Moments
-- SELECT id, slug, content, "friendVisibility", "happenedAt"
-- FROM "Moment"
-- WHERE "friendId" = 'REPLACE_WITH_ALICE_ID'
-- ORDER BY "createdAt" DESC;

-- 查询所有 PUBLIC Moments
-- SELECT id, slug, content, "friendVisibility", "happenedAt"
-- FROM "Moment"
-- WHERE "friendVisibility" = 'PUBLIC'
-- ORDER BY "createdAt" DESC;

-- 查询 Alice 应该能看到的所有 Moments（PUBLIC + FRIEND_ONLY for Alice）
-- SELECT id, slug, content, "friendVisibility", "happenedAt"
-- FROM "Moment"
-- WHERE "friendVisibility" = 'PUBLIC'
--    OR ("friendVisibility" = 'FRIEND_ONLY' AND "friendId" = 'REPLACE_WITH_ALICE_ID')
-- ORDER BY "createdAt" DESC;
