import {execSync} from "child_process"
import path from "path"
import config from "../configs/config"
import eventEmitter from "./logging"

export class PrismaMigrator {
	private dbName: string
	private env: string

	constructor(dbName: string, env?: string) {
		this.dbName = dbName
		this.env = env ?? config.env
	}

	private buildDatabaseUrl(): string {
		const dbConfig = config.db?.[this.env as keyof typeof config.db]

		if (!dbConfig) {
			throw new Error(
				`Database configuration not found for environment: ${this.env}`
			)
		}

		const {protocol, user, password, host, port} = dbConfig

		if (!protocol || !user || !password || !host || !port || !this.dbName) {
			throw new Error("Missing DB credentials or database name.")
		}

		return `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${this.dbName}?schema=public`
	}

	public runMigrations(): void {
		const databaseUrl = this.buildDatabaseUrl()
		const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma")

		try {
			console.log(`🚀 Running migrations on DB: ${this.dbName}`)
			execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
				env: {...process.env, DATABASE_URL: databaseUrl},
				stdio: "inherit"
			})
			eventEmitter.emit("logging", "Migration succesfull")
		} catch (err) {
			eventEmitter.emit(
				"logging",
				`Migration failed for DB: ${this.dbName}`
			)
			console.error(err)
			process.exit(1)
		}
	}
}
