import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { updateBrandFields } from "@/lib/airtable/brands"
import { brandRegistrationSchema } from "@/lib/validation/brand-schema"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params
    const body = await request.json()

    // Validar datos con Zod
    const validationResult = brandRegistrationSchema.partial().safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    await updateBrandFields(recordId, validationResult.data)

    return NextResponse.json({
      success: true,
      recordId,
    })
  } catch (error) {
    console.error("Error updating brand fields:", error)
    Sentry.captureException(error, {
      tags: {
        route: '/api/brands/[recordId]/fields',
        method: 'PATCH',
        component: 'api'
      },
      extra: {
        recordId: await params.then(p => p.recordId),
        message: "Error updating brand fields in Airtable"
      }
    })
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al actualizar los campos",
      },
      { status: 500 }
    )
  }
}



