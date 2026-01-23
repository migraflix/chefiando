"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"

export default function AirtableDebugPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testConnection = async () => {
    setTesting(true)
    setResults(null)

    try {
      const response = await fetch("/api/debug/airtable")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🔍 Diagnóstico de Airtable</h1>
          <p className="text-muted-foreground">
            Herramienta de diagnóstico para verificar la conexión con Airtable
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prueba de Conexión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={testing} className="flex-1">
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Probando conexión...
                  </>
                ) : (
                  "Probar Conexión a Airtable"
                )}
              </Button>
              <Button
                onClick={async () => {
                  setTesting(true)
                  try {
                    const response = await fetch("/api/debug/test-permissions")
                    const data = await response.json()
                    setResults((prev: any) => ({ ...prev, permissionsTest: data }))
                  } catch (error) {
                    setResults((prev: any) => ({
                      ...prev,
                      permissionsTest: { error: error instanceof Error ? error.message : "Error desconocido" },
                    }))
                  } finally {
                    setTesting(false)
                  }
                }}
                disabled={testing}
                variant="outline"
                className="flex-1"
              >
                Probar Permisos
              </Button>
            </div>

            {results && results.env && (
              <div className="space-y-4 mt-6">
                {/* Variables de Entorno */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    {results.env.hasApiKey && results.env.hasBaseId ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Variables de Entorno
                  </h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      {results.env.hasApiKey ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>AIRTABLE_API_KEY: {results.env.hasApiKey ? "✅ Configurada" : "❌ No configurada"}</span>
                      {results.env.apiKeyLength && (
                        <span className="text-muted-foreground">({results.env.apiKeyLength} caracteres)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {results.env.hasBaseId ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>AIRTABLE_BASE_ID: {results.env.hasBaseId ? "✅ Configurada" : "❌ No configurada"}</span>
                      {results.env.baseIdLength && (
                        <span className="text-muted-foreground">({results.env.baseIdLength} caracteres)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acceso a la Base */}
                {results.env && results.env.hasApiKey && results.env.hasBaseId && results.baseAccess && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      {results.baseAccess.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      Acceso a la Base de Airtable
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      {results.baseAccess.success ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Acceso a la base exitoso</span>
                          </div>
                          {results.baseAccess.tables && results.baseAccess.tables.length > 0 && (
                            <div className="mt-3">
                              <p className="font-semibold mb-2">Tablas encontradas ({results.baseAccess.tables.length}):</p>
                              <ul className="list-disc list-inside space-y-1">
                                {results.baseAccess.tables.map((table: any, idx: number) => (
                                  <li key={idx} className="font-mono text-xs">
                                    {table.name} {table.name === "Brands" && "✅"}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>No se pudo acceder a la base</span>
                          </div>
                          {results.baseAccess.error && (
                            <div className="mt-2">
                              <p className="font-semibold">Error:</p>
                              <pre className="bg-background p-2 rounded text-xs overflow-auto">
                                {typeof results.baseAccess.error === "string"
                                  ? results.baseAccess.error
                                  : JSON.stringify(results.baseAccess.error, null, 2)}
                              </pre>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Status: {results.baseAccess.status || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prueba de Conexión a Tabla */}
                {results.env && results.env.hasApiKey && results.env.hasBaseId && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      {results.connection.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      Prueba de Conexión a Tabla "Brands"
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      {results.connection.success ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Conexión exitosa</span>
                          </div>
                          <div className="text-muted-foreground">
                            <p>Status: {results.connection.status}</p>
                            <p>Registros encontrados: {results.connection.recordsCount || 0}</p>
                            {results.connection.workingTableName && (
                              <p className="text-green-600 font-semibold">
                                ✅ Tabla que funciona: "{results.connection.workingTableName}"
                              </p>
                            )}
                            {results.connection.url && (
                              <p className="text-xs mt-2 break-all">
                                URL: <span className="font-mono">{results.connection.url}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>Error de conexión</span>
                          </div>
                          <div className="text-muted-foreground space-y-1">
                            <p>Status: {results.connection.status || "N/A"}</p>
                            {results.connection.error && (
                              <div className="mt-2">
                                <p className="font-semibold">Error:</p>
                                <pre className="bg-background p-2 rounded text-xs overflow-auto">
                                  {typeof results.connection.error === "string"
                                    ? results.connection.error
                                    : JSON.stringify(results.connection.error, null, 2)}
                                </pre>
                              </div>
                            )}
                            {results.connection.url && (
                              <p className="text-xs mt-2 break-all">
                                URL intentada: <span className="font-mono">{results.connection.url}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Información del Servidor */}
                {results.server && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-blue-500" />
                      Información del Servidor
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                      <div>Node Environment: {results.server.nodeEnv}</div>
                      <div>Platform: {results.server.platform}</div>
                      <div>Architecture: {results.server.arch}</div>
                    </div>
                  </div>
                )}

                {/* Pruebas de Diferentes Nombres de Tabla */}
                {results.tableTests && results.tableTests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-blue-500" />
                      Pruebas con Diferentes Nombres de Tabla
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      {results.tableTests.map((test: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2 rounded border ${
                            test.success
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold">{test.tableName}</span>
                            {test.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          {test.success ? (
                            <p className="text-xs text-green-600 mt-1">
                              ✅ Funciona - {test.recordsCount || 0} registros
                            </p>
                          ) : (
                            <div className="text-xs text-red-600 mt-1">
                              <p>Status: {test.status}</p>
                              {test.error && (
                                <pre className="mt-1 text-xs overflow-auto">
                                  {typeof test.error === "string"
                                    ? test.error
                                    : JSON.stringify(test.error, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prueba de Permisos Detallada */}
                {results?.permissionsTest && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-blue-500" />
                      Prueba de Permisos Detallada
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
                      {results.permissionsTest.summary && (
                        <div className="pb-3 border-b">
                          <p>
                            <span className="font-semibold">Resumen:</span> {results.permissionsTest.summary.successful}/
                            {results.permissionsTest.summary.total} pruebas exitosas
                          </p>
                          {results.permissionsTest.summary.failed > 0 && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="font-semibold text-yellow-800 mb-2">⚠️ Problema Detectado:</p>
                              <p className="text-yellow-700 text-sm mb-2">
                                Tu API Key es válida pero <strong>no tiene permisos para acceder a la base específica</strong>.
                              </p>
                              <div className="text-sm text-yellow-700 space-y-1">
                                <p className="font-semibold">Solución:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                  <li>Ve a <a href="https://airtable.com/create/tokens" target="_blank" rel="noopener noreferrer" className="underline">Airtable → Create Token</a></li>
                                  <li>Crea un nuevo token o edita el existente</li>
                                  <li>En "Access", selecciona tu base específica</li>
                                  <li>Da permisos: <code className="bg-yellow-100 px-1 rounded">data.records:read</code> y <code className="bg-yellow-100 px-1 rounded">data.records:write</code></li>
                                  <li>Copia el nuevo token y actualiza tu <code className="bg-yellow-100 px-1 rounded">.env.local</code></li>
                                  <li>Reinicia el servidor</li>
                                </ol>
                                <p className="mt-2 text-xs">
                                  📄 Ver guía completa en: <code className="bg-yellow-100 px-1 rounded">SOLUCION_PERMISOS_AIRTABLE.md</code>
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {results.permissionsTest.tests?.map((test: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded border ${
                            test.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{test.name}</span>
                            {test.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          {test.status && (
                            <p className="text-xs text-muted-foreground">Status: {test.status}</p>
                          )}
                          {test.data && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                Ver detalles
                              </summary>
                              <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-40">
                                {typeof test.data === "string"
                                  ? test.data
                                  : JSON.stringify(test.data, null, 2)}
                              </pre>
                            </details>
                          )}
                          {test.error && (
                            <p className="text-xs text-red-600 mt-1">{test.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errores */}
                {results.error && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      Error General
                    </h3>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <pre className="text-sm text-red-800 overflow-auto">
                        {typeof results.error === "string"
                          ? results.error
                          : JSON.stringify(results.error, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análisis de Formato de Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={async () => {
              try {
                const response = await fetch("/api/debug/check-env")
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
                  setResults((prev: any) => ({ ...prev, envAnalysis: { error: errorData } }))
                  return
                }
                const data = await response.json()
                setResults((prev: any) => ({ ...prev, envAnalysis: data }))
              } catch (error) {
                console.error("Error checking env format:", error)
                setResults((prev: any) => ({
                  ...prev,
                  envAnalysis: {
                    error: error instanceof Error ? error.message : "Error desconocido",
                  },
                }))
              }
            }} className="w-full">
              Analizar Formato de Variables
            </Button>

            {results?.envAnalysis && results.envAnalysis.analysis && (
              <div className="space-y-4 mt-4">
                {results.envAnalysis.analysis.apiKey && (
                  <div>
                    <h4 className="font-semibold mb-2">API Key</h4>
                    <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                      <div>Longitud: {results.envAnalysis.analysis.apiKey.length || 0} caracteres</div>
                      <div>Formato: {results.envAnalysis.analysis.apiKey.expectedFormat || "N/A"}</div>
                      {results.envAnalysis.analysis.apiKey.hasSpaces && (
                        <div className="text-red-600">⚠️ Contiene espacios</div>
                      )}
                      {results.envAnalysis.analysis.apiKey.hasNewlines && (
                        <div className="text-red-600">⚠️ Contiene saltos de línea</div>
                      )}
                      {results.envAnalysis.preview && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Preview: {results.envAnalysis.preview.apiKey}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {results.envAnalysis.analysis.baseId && (
                  <div>
                    <h4 className="font-semibold mb-2">Base ID</h4>
                    <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                      <div>Longitud: {results.envAnalysis.analysis.baseId.length || 0} caracteres</div>
                      <div>Formato: {results.envAnalysis.analysis.baseId.expectedFormat || "N/A"}</div>
                      {results.envAnalysis.analysis.baseId.hasSpaces && (
                        <div className="text-red-600">⚠️ Contiene espacios</div>
                      )}
                      {results.envAnalysis.analysis.baseId.hasNewlines && (
                        <div className="text-red-600">⚠️ Contiene saltos de línea</div>
                      )}
                      {results.envAnalysis.preview && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Preview: {results.envAnalysis.preview.baseId}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {results.envAnalysis.analysis.recommendations && results.envAnalysis.analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Recomendaciones</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {results.envAnalysis.analysis.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className={rec.startsWith("✅") ? "text-green-600" : rec.startsWith("⚠️") ? "text-yellow-600" : "text-blue-600"}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {results?.envAnalysis?.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold">Error al analizar variables:</p>
                <pre className="text-xs text-red-600 mt-2 overflow-auto">
                  {typeof results.envAnalysis.error === "string"
                    ? results.envAnalysis.error
                    : JSON.stringify(results.envAnalysis.error, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Útil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Esta página solo funciona en desarrollo</p>
            <p>• Verifica que el archivo .env.local esté en la raíz del proyecto</p>
            <p>• Reinicia el servidor después de cambiar variables de entorno</p>
            <p>• Las variables NO deben tener espacios, saltos de línea o comillas</p>
            <p>• El API Key debe estar en una sola línea: <code className="bg-muted px-1 rounded">AIRTABLE_API_KEY=patxxxxx...</code></p>
            <p>• El Base ID debe estar en una sola línea: <code className="bg-muted px-1 rounded">AIRTABLE_BASE_ID=appxxxxx...</code></p>
            <p className="mt-4 font-semibold text-foreground">Si el formato es correcto pero sigue dando 403:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Verifica en Airtable que el API Key tenga acceso a esta base</li>
              <li>Revisa que el API Key no tenga restricciones de IP o dominio</li>
              <li>Regenera el API Key en Airtable si es necesario</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

