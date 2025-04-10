import config from "../configs/config"
import {DBConfig} from "../types/db"

export function buildDatabaseUrl(dbName: string, env?: string): string {
	const environment = env ?? config.env
	const dbConfig: DBConfig =
		config.db?.[environment as keyof typeof config.db]

	if (!dbConfig) {
		throw new Error(
			`Database configuration not found for environment: ${environment}`
		)
	}

	const {protocol, user, password, host, port} = dbConfig

	if (!protocol || !user || !password || !host || !port || !dbName) {
		throw new Error("Missing DB credentials or database name.")
	}

	return `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?schema=public`
}
