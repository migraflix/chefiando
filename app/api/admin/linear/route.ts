import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const LINEAR_API = 'https://api.linear.app/graphql'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const query = `
    query {
      project(id: "${process.env.LINEAR_PROJECT_ID}") {
        name
        issues(first: 100, orderBy: updatedAt) {
          nodes {
            id
            title
            description
            priority
            state {
              name
              type
              color
            }
            assignee {
              name
              avatarUrl
            }
            createdAt
            updatedAt
            url
          }
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

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { title, description } = await request.json()

  const mutation = `
    mutation {
      issueCreate(input: {
        title: "${title.replace(/"/g, '\\"')}",
        description: "${(description || '').replace(/"/g, '\\"')}",
        teamId: "${process.env.LINEAR_TEAM_ID}",
        projectId: "${process.env.LINEAR_PROJECT_ID}"
      }) {
        success
        issue {
          id
          title
          url
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
