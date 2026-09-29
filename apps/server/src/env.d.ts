declare namespace NodeJS {
    interface ProcessEnv {
        DATABASE_URL: string
        JWT_SECRET: string
        JWT_EXPIRES_IN: string
        PORT: string
        NODE_ENV: string
    }
}
