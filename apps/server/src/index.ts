import 'dotenv/config'

import type { ErrorRequestHandler } from 'express-zod'
import { Router } from 'express-zod'
import { z } from 'zod'

const port = Number(process.env.PORT ?? 3000)

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof z.ZodError) {
        res.status(400).json({ issues: err.issues })
        return
    }
    res.status(500).json({ message: 'Internal Server Error' })
}

const app = new Router({ prefix: '/api' })
    .get(
        '/health',
        { responses: { 200: z.object({ ok: z.literal(true) }) } },
        () => ({ ok: true as const }),
    )
    .use<'error'>(errorHandler)

app.listen(port, () => {
    console.log(`AAMS server listening on http://localhost:${port}`)
})
