import {PrismaClient} from "@prisma/client"

const prisma = new PrismaClient()
async function main() {
	const defaultDialer = await prisma.tp_services.upsert({
		where: {slug: "elision"},
		update: {},
		create: {
			slug: "elision",
			name: "Elision-cloud"
		}
	})
	const defaultCrossSalesCampaigns = await prisma.tp_campaigns.findFirst({
		where: {listId: 240705132658, sourceId: "FSCrossSell"}
	})

	if (!defaultCrossSalesCampaigns) {
		await prisma.tp_campaigns.create({
			data: {
				listId: 240705132658,
				sourceId: "FSCrossSell",
				serviceId: defaultDialer.id,
				slug: "FSCROSSSELL"
			}
		})
	}

	const defaultFsCampaigns = await prisma.tp_campaigns.findFirst({
		where: {listId: 231204155508, sourceId: "FSOPS"}
	})

	if (!defaultFsCampaigns) {
		await prisma.tp_campaigns.create({
			data: {
				listId: 231204155508,
				sourceId: "FSOPS",
				serviceId: defaultDialer.id,
				slug: "FS"
			}
		})
	}

	const defaultPlopsCampaigns = await prisma.tp_campaigns.findFirst({
		where: {listId: 240724184740, sourceId: "FS_PLOps"}
	})

	if (!defaultPlopsCampaigns) {
		await prisma.tp_campaigns.create({
			data: {
				listId: 240724184740,
				sourceId: "FS_PLOps",
				serviceId: defaultDialer.id,
				slug: "FSPLOPS"
			}
		})
	}
}
main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		await prisma.$disconnect()
		process.exit(1)
	})
