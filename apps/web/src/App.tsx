import type { App as ServerApp } from '@aams/server'
import { defineClient } from '@express-zod/client'
import { useEffect, useState } from 'react'

const client = defineClient('http://localhost:3000/').as<ServerApp>()

export function App() {
    const [state, setState] = useState<{ ok: boolean; database: string }>()
    useEffect(() => {
        client.get('/api/health').then((res) => {
            setState(res.body)
        })
    }, [])

    return (
        <>
            <div>Hello World</div>
            <div>
                Health check:
                <br />
                Ok: <span>{state?.ok ? 'true' : 'false'}</span>
                <br />
                Database: <span>{state?.database}</span>
            </div>
        </>
    )
}
