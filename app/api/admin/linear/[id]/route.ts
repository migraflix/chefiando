import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const LINEAR_API = 'https://api.linear.app/graphql'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const query = `
    query {
      issue(id: "${id}") {
        id
        title
        description
        priority
        state { name type color }
        assignee { name avatarUrl }
        creator { name avatarUrl }
        createdAt
        updatedAt
        url
        comments {
          nodes {
            id
            body
            createdAt
            user { name avatarUrl }
          }
        }
        labels {
          nodes { id name color }
        }
      }
    }
  `

  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.LINEAR_API_KEY!,
    },
    body: JSON.stringify({ query }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { body } = await _req.json()

  const mutation = `
    mutation {
      commentCreate(input: {
        issueId: "${id}",
        body: ${JSON.stringify(body)}
      }) {
        success
        comment {
          id
          body
          createdAt
          user { name avatarUrl }
        }
      }
    }
  `

  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.LINEAR_API_KEY!,
    },
    body: JSON.stringify({ query: mutation }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
