export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const baseId = process.env.AIRTABLE_BASE_ID
    const apiKey = process.env.AIRTABLE_API_KEY

    if (!baseId || !apiKey) {
      return Response.json({ error: "Missing Airtable configuration" }, { status: 500 })
    }

    // Use view ID for reviewed status - this view has all 22 records pre-filtered
    const contentUrl = `https://api.airtable.com/v0/${baseId}/Content?view=viwyLBbj3M1yTQ6w9`

    let allRecords = []
    let offset = ""

    do {
      let paginatedUrl = contentUrl
      if (offset) {
        paginatedUrl += `&offset=${offset}`
      }

      const pageResponse = await fetch(paginatedUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!pageResponse.ok) {
        const errorText = await pageResponse.text()
        console.error("[v0] Airtable API error:", pageResponse.status, errorText)
        throw new Error(`Failed to fetch content: ${pageResponse.status}`)
      }

      const pageData = await pageResponse.json()
      allRecords = [...allRecords, ...pageData.records]
      offset = pageData.offset

      console.log(`[v0] Fetched ${pageData.records.length} records, total so far: ${allRecords.length}`)
    } while (offset)

    const contentData = { records: allRecords }

    // Get unique brand IDs from content
    const brandIds = [...new Set(contentData.records.map((record: any) => record.fields.Brand?.[0]).filter(Boolean))]

    console.log(`[v0] Total records from view: ${allRecords.length}, Unique brands: ${brandIds.length}`)

    // Fetch brand names
    const brandNames: Record<string, string> = {}

    if (brandIds.length > 0) {
      const brandFilter = `OR(${brandIds.map((id) => `RECORD_ID() = '${id}'`).join(", ")})`
      // SIEMPRE usar "Brands" como nombre de tabla (funciona en producción y desarrollo)
      const BRANDS_TABLE_NAME = "Brands"
      const brandsUrl = `https://api.airtable.com/v0/${baseId}/${BRANDS_TABLE_NAME}?filterByFormula=${encodeURIComponent(brandFilter)}`

      const brandsResponse = await fetch(brandsUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (brandsResponse.ok) {
        const brandsData = await brandsResponse.json()
        brandsData.records.forEach((brand: any) => {
          brandNames[brand.id] = brand.fields.Negocio || "Sin nombre"
        })
      }
    }

    // Map content with brand information
    const allContent = contentData.records.map((record: any) => {
      const brandId = record.fields.Brand?.[0]
      return {
        ...record,
        brandId: brandId,
        brandName: brandId ? brandNames[brandId] || "Sin nombre" : "Sin nombre",
      }
    })

    return Response.json({ content: allContent })
  } catch (error) {
    console.error("Error fetching all content:", error)
    return Response.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}
