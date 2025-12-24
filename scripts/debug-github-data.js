const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function debug() {
    try {
        // 1. Get GitHub credential
        const cred = await p.externalCredential.findFirst({
            where: { platform: 'GITHUB' }
        });

        if (!cred) {
            console.log('No GitHub credential found');
            return;
        }

        console.log('=== GitHub Credential ===');
        console.log('Display Name:', cred.displayName);
        console.log('Metadata:', JSON.stringify(cred.metadata));
        console.log('Token (first 20 chars):', cred.value.substring(0, 20) + '...');

        // 2. Check contribution data in DB
        const contribs = await p.gitHubContribution.findMany({
            orderBy: { date: 'desc' },
            take: 10
        });

        console.log('\n=== Recent Contributions in DB ===');
        console.log('Total records:', await p.gitHubContribution.count());
        contribs.forEach(c => console.log(`  ${c.date.toISOString().split('T')[0]}: ${c.value}`));

        // 3. Use token to fetch real data from GitHub
        const token = cred.value;
        const metadata = cred.metadata;

        console.log('\n=== Fetching REAL data from GitHub ===');

        // First get the authenticated user
        const userRes = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await userRes.json();
        console.log('Authenticated as:', user.login);

        // Fetch contribution graph via GraphQL
        const graphqlQuery = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

        const graphqlRes = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: graphqlQuery,
                variables: { username: user.login }
            })
        });

        const graphqlData = await graphqlRes.json();

        if (graphqlData.errors) {
            console.log('GraphQL Error:', graphqlData.errors[0].message);
        } else {
            const calendar = graphqlData.data.user.contributionsCollection.contributionCalendar;
            console.log('Total contributions (from GitHub):', calendar.totalContributions);

            // Get recent days
            const weeks = calendar.weeks;
            const allDays = weeks.flatMap(w => w.contributionDays);
            const recentDays = allDays.slice(-10);

            console.log('\nRecent 10 days from GitHub API:');
            recentDays.forEach(d => console.log(`  ${d.date}: ${d.contributionCount}`));

            // Compare with DB
            console.log('\n=== COMPARISON ===');
            console.log('DB has', contribs.length, 'recent records');
            console.log('GitHub API returned', allDays.length, 'days');

            // Check if any mismatch
            const dbMap = new Map(contribs.map(c => [c.date.toISOString().split('T')[0], c.value]));

            let mismatches = 0;
            for (const day of recentDays) {
                const dbVal = dbMap.get(day.date);
                if (dbVal !== undefined && dbVal !== day.contributionCount) {
                    console.log(`  MISMATCH: ${day.date} - DB: ${dbVal}, GitHub: ${day.contributionCount}`);
                    mismatches++;
                }
            }

            if (mismatches === 0) {
                console.log('  No mismatches in recent data (data is synced correctly)');
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
        console.error(e.stack);
    } finally {
        await p.$disconnect();
    }
}

debug();
