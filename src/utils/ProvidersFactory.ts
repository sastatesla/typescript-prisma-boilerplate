import {PrismaClient} from "@prisma/client"
import eventEmitter from "./logging"
import config from "../configs/config"

type QueryFunction = (query: string) => Promise<any>
type ReleaseFunction = () => void

export class ProvidersFactory {
	private static prismaClients: Record<string, PrismaClient> = {}

	private createPrismaClient(dbName: string): PrismaClient {
		const url = this.buildDatabaseUrl(dbName)
		const client = new PrismaClient({
			datasources: {
				db: {
					url
				}
			},
			log: [
				{
					emit: "event",
					level: "query"
				}
			]
		})

		client.$on("query", (e: {query: string}) => {
			eventEmitter.emit("logging", `Prisma := ${e.query}`)
		})

		return client
	}

	private buildDatabaseUrl(dbName: string): string {
		const {protocol, user, password, host, port} = config.db

		if (!protocol || !user || !password || !host || !port || !dbName) {
			throw new Error("Missing DB credentials or database name.")
		}

		return `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?schema=public`
	}

	public async getPrismaClient(dbName: string): Promise<PrismaClient> {
		if (!ProvidersFactory.prismaClients[dbName]) {
			ProvidersFactory.prismaClients[dbName] =
				this.createPrismaClient(dbName)
			eventEmitter.emit(
				"logging",
				`Prisma client initialized for: ${dbName}`
			)
		}

		return ProvidersFactory.prismaClients[dbName]
	}

	public async transaction(dbName?: string): Promise<{
		query: QueryFunction
		release: ReleaseFunction
		prisma: PrismaClient
	}> {
		dbName = dbName ?? config.db.mainDbName

		const prisma = await this.getPrismaClient(
			dbName ?? config.db.mainDbName
		)

		const query: QueryFunction = async (sql: string) => {
			return await prisma.$queryRawUnsafe(sql)
		}

		const release: ReleaseFunction = () => {
			// No-op
		}

		return {query, release, prisma}
	}
}
