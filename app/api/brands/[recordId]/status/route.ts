import { NextRequest, NextResponse } from "next/server"
import { updateBrandStatus } from "@/lib/airtable/brands"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: "Status es requerido" },
        { status: 400 }
      )
    }

    await updateBrandStatus(recordId, status)

    return NextResponse.json({
      success: true,
      recordId,
      status,
    })
  } catch (error) {
    console.error("Error updating brand status:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al actualizar el status",
      },
      { status: 500 }
    )
  }
}

