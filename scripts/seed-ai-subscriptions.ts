/**
 * Seed AI tool subscriptions
 * Run with: npx tsx scripts/seed-ai-subscriptions.ts
 */

import { PrismaClient, SubscriptionBillingCycle } from "@prisma/client";

const prisma = new PrismaClient();

const AI_SUBSCRIPTIONS = [
  {
    name: "ChatGPT Plus",
    currency: "USD",
    amount: 20,
    amountCNY: 145, // ~7.25 USD/CNY
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes:
      "OpenAI's flagship conversational AI with GPT-4 access, priority access during peak times",
    originalRateToCNY: 7.25,
  },
  {
    name: "GitHub Copilot",
    currency: "USD",
    amount: 10,
    amountCNY: 72.5,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "AI pair programmer that helps write code faster with intelligent suggestions",
    originalRateToCNY: 7.25,
  },
  {
    name: "Midjourney",
    currency: "USD",
    amount: 30,
    amountCNY: 217.5,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "AI image generation tool for creating stunning visual art and designs",
    originalRateToCNY: 7.25,
  },
  {
    name: "Claude Pro",
    currency: "USD",
    amount: 20,
    amountCNY: 145,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "Anthropic's advanced AI assistant with extended context and priority access",
    originalRateToCNY: 7.25,
  },
  {
    name: "Notion AI",
    currency: "USD",
    amount: 10,
    amountCNY: 72.5,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "AI-powered writing assistant integrated into Notion workspace",
    originalRateToCNY: 7.25,
  },
  {
    name: "Cursor",
    currency: "USD",
    amount: 20,
    amountCNY: 145,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "AI-first code editor with advanced autocomplete and chat features",
    originalRateToCNY: 7.25,
  },
  {
    name: "Perplexity Pro",
    currency: "USD",
    amount: 20,
    amountCNY: 145,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "AI-powered search engine with real-time information and citations",
    originalRateToCNY: 7.25,
  },
  {
    name: "DeepL Pro",
    currency: "EUR",
    amount: 8.74,
    amountCNY: 68,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "AI translation service with superior quality for 31+ languages",
    originalRateToCNY: 7.78,
  },
  {
    name: "Grammarly Premium",
    currency: "USD",
    amount: 12,
    amountCNY: 87,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "AI writing assistant for grammar, tone, and clarity improvements",
    originalRateToCNY: 7.25,
  },
  {
    name: "Runway ML",
    currency: "USD",
    amount: 15,
    amountCNY: 108.75,
    billingCycle: SubscriptionBillingCycle.MONTHLY,
    notes: "AI video generation and editing platform with Gen-2 model access",
    originalRateToCNY: 7.25,
  },
];

async function seedSubscriptions() {
  console.log("🌱 Starting to seed AI subscriptions...\n");

  // Get the first admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.error("❌ No admin user found. Please create an admin user first.");
    process.exit(1);
  }

  console.log(`✅ Found admin user: ${adminUser.email || adminUser.id}`);
  console.log(`📝 Creating ${AI_SUBSCRIPTIONS.length} AI tool subscriptions...\n`);

  // Calculate start dates (spread over the last 6 months)
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < AI_SUBSCRIPTIONS.length; i++) {
    const sub = AI_SUBSCRIPTIONS[i];

    // Spread start dates across the last 6 months
    const startDate = new Date(sixMonthsAgo);
    startDate.setDate(startDate.getDate() + Math.floor((i / AI_SUBSCRIPTIONS.length) * 180));

    try {
      const created = await prisma.subscription.create({
        data: {
          userId: adminUser.id,
          name: sub.name,
          currency: sub.currency,
          amount: sub.amount,
          amountCNY: sub.amountCNY,
          billingCycle: sub.billingCycle,
          startDate,
          endDate: null, // No end date for active subscriptions
          notes: sub.notes,
          originalRateToCNY: sub.originalRateToCNY,
        },
      });

      console.log(
        `✅ Created: ${created.name} - ${sub.currency} ${sub.amount}/month (¥${sub.amountCNY})`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to create ${sub.name}:`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Seeding completed!`);
  console.log(`✅ Successfully created: ${successCount} subscriptions`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} subscriptions`);
  }

  // Calculate totals
  const totalMonthly = AI_SUBSCRIPTIONS.reduce((sum, sub) => sum + sub.amountCNY, 0);
  const totalAnnual = totalMonthly * 12;

  console.log(`\n💰 Total Monthly Cost: ¥${totalMonthly.toFixed(2)}`);
  console.log(`💰 Total Annual Cost: ¥${totalAnnual.toFixed(2)}`);
}

seedSubscriptions()
  .catch((error) => {
    console.error("\n❌ Error during seeding:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
