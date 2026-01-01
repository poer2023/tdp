import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const moments = await prisma.moment.findMany({
        select: { id: true, content: true, images: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    console.log(`Checking ${moments.length} moments...`);

    for (const m of moments) {
        const images = m.images as unknown[];
        if (!images || !Array.isArray(images)) continue;

        for (const img of images) {
            if (typeof img === 'string' && img.startsWith('blob:')) {
                console.log('BLOB URL found in moment:', m.id);
                console.log('  Content:', m.content?.substring(0, 50));
                console.log('  Images:', images);
                console.log('---');
            } else if (typeof img === 'object' && img !== null) {
                const imgObj = img as Record<string, unknown>;
                const url = imgObj.url || imgObj.filePath;
                if (typeof url === 'string' && url.startsWith('blob:')) {
                    console.log('BLOB URL found in moment (object):', m.id);
                    console.log('  Content:', m.content?.substring(0, 50));
                    console.log('  Image object:', imgObj);
                    console.log('---');
                }
            }
        }
    }

    console.log('Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
