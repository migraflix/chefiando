import { type NextRequest, NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const TABLE_NAME = "Content"
const PHOTOS_TABLE_NAME = "Fotos AI"

export async function GET(request: NextRequest, { params }: { params: { recordId: string } }) {
  const { recordId } = params

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Configuración de Airtable incompleta" }, { status: 500 })
  }

  try {
    const encodedTableName = encodeURIComponent("Content")
    const encodedPhotosTableName = encodeURIComponent("Fotos AI")

    // 1. Fetch the Content record
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}/${recordId}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error("Error al obtener el registro de Airtable")
    }

    const data = await response.json()

    // 2. Check if there is a linked "Fotos AI" record
    const linkedPhotoIds = data.fields["Fotos AI"]
    let aiPhotoData = null

    if (linkedPhotoIds && Array.isArray(linkedPhotoIds) && linkedPhotoIds.length > 0) {
      const photoRecordId = linkedPhotoIds[0]
      try {
        const photoResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedPhotosTableName}/${photoRecordId}`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            },
          },
        )

        if (photoResponse.ok) {
          aiPhotoData = await photoResponse.json()
        }
      } catch (photoError) {
        console.error("Error fetching linked photo record:", photoError)
      }
    }

    // Return combined data
    return NextResponse.json({
      ...data,
      aiPhoto: aiPhotoData,
    })
  } catch (error) {
    console.error("Error fetching from Airtable:", error)
    return NextResponse.json({ error: "Error al cargar el contenido" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { recordId: string } }) {
  const { recordId } = params

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Configuración de Airtable incompleta" }, { status: 500 })
  }

  try {
    const encodedTableName = encodeURIComponent("Content")
    const encodedPhotosTableName = encodeURIComponent("Fotos AI")

    const { fields, brandId, contentId, aiPhotoId } = await request.json()

    // Separate fields for Content and Fotos AI tables
    const contentFields: Record<string, any> = {}
    const photoFields: Record<string, any> = {}

    // Map fields to their respective tables
    // Content table fields
    if (fields["Calificación Post"] !== undefined) {
      contentFields["Calificación Post"] = fields["Calificación Post"] === 0 ? null : fields["Calificación Post"]
    }
    if (fields["Calificación Imagen"] !== undefined) {
      contentFields["Calificación Imagen"] = fields["Calificación Imagen"] === 0 ? null : fields["Calificación Imagen"]
    }
    if (fields["Comentarios Post"] !== undefined) contentFields["Comentarios Post"] = fields["Comentarios Post"]
    if (fields["Comentario Imagen"] !== undefined) contentFields["Comentario Imagen"] = fields["Comentario Imagen"]
    if (fields["Status"] !== undefined) contentFields["Status"] = fields["Status"]

    // Fotos AI table fields
    if (fields["Nombre"] !== undefined) photoFields["Nombre"] = fields["Nombre"]
    if (fields["Precio"] !== undefined) photoFields["Precio"] = fields["Precio"]
    if (fields["Ingredientes"] !== undefined) photoFields["Ingredientes"] = fields["Ingredientes"]

    // 1. Update Content record
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedTableName}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: contentFields,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al actualizar el registro en Airtable")
    }

    const data = await response.json()

    // 2. Update Fotos AI record if needed and if we have an ID
    if (aiPhotoId && Object.keys(photoFields).length > 0) {
      try {
        await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodedPhotosTableName}/${aiPhotoId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: photoFields,
          }),
        })
      } catch (photoError) {
        console.error("Error updating linked photo record:", photoError)
      }
    }

    if (brandId) {
      try {
        let webhookUrl = process.env.feedbackWebhook

        // Check if we are in production environment (Vercel specific)
        const isProduction = process.env.VERCEL_ENV === "production"

        if (webhookUrl) {
          // If in production, remove "-test" from the URL
          if (isProduction) {
            webhookUrl = webhookUrl.replace("-test", "")
          }

          console.log(`[Webhook] Sending to: ${webhookUrl} (Env: ${process.env.VERCEL_ENV})`)

          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              brandId: brandId,
              contentId: contentId || recordId,
              Nombre: photoFields["Nombre"] || "",
            }),
          })
        } else {
          console.warn("feedbackWebhook environment variable is not defined")
        }
      } catch (webhookError) {
        console.error("Error sending webhook:", webhookError)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating Airtable:", error)
    return NextResponse.json({ error: "Error al guardar las calificaciones" }, { status: 500 })
  }
}
