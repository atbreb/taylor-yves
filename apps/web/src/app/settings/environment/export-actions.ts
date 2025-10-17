'use server'

/**
 * Server Actions for Exporting Environment Variables to .env File
 *
 * These actions allow exporting environment variables from the UI
 * directly to the .env file, avoiding manual editing.
 */

import { getEnvironmentVariables } from './actions'
import * as fs from 'fs'
import * as path from 'path'

interface ExportToEnvResponse {
  success: boolean
  message: string
  error?: string
  path?: string
}

/**
 * Export environment variables to .env file
 */
export async function exportToEnvFile(
  selectedGroups?: string[]
): Promise<ExportToEnvResponse> {
  try {
    // Get all environment variables
    const envVarsResponse = await getEnvironmentVariables()

    if (!envVarsResponse.success || !envVarsResponse.variables) {
      return {
        success: false,
        message: 'Failed to retrieve environment variables',
        error: envVarsResponse.error
      }
    }

    // Filter by selected groups if provided
    let variables = envVarsResponse.variables
    if (selectedGroups && selectedGroups.length > 0) {
      // Note: We don't have group info in the variables, so we export all
      // In a future version, we could add group metadata to each variable
    }

    // Build .env file content
    const envFileContent = generateEnvFileContent(variables)

    // Determine .env file path (monorepo root)
    const envFilePath = path.join(process.cwd(), '..', '..', '.env')

    // Check if file exists and create backup
    if (fs.existsSync(envFilePath)) {
      const backupPath = `${envFilePath}.backup.${Date.now()}`
      fs.copyFileSync(envFilePath, backupPath)
    }

    // Write to .env file
    fs.writeFileSync(envFilePath, envFileContent, 'utf8')

    return {
      success: true,
      message: `Successfully exported ${variables.length} variables to .env file`,
      path: envFilePath
    }
  } catch (error) {
    console.error('Export to .env error:', error)
    return {
      success: false,
      message: 'Failed to export to .env file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate .env file content from variables
 */
function generateEnvFileContent(
  variables: Array<{ key: string; value: string; description?: string }>
): string {
  const timestamp = new Date().toISOString().split('T')[0]

  let content = `# Taylor-Yves Environment Configuration
# Generated: ${timestamp}
# Exported from UI at /settings/environment

# ===========================================
# ENCRYPTION KEY
# ===========================================
# Used for encrypting sensitive data
# Generate with: openssl rand -hex 32
`

  // Add ENCRYPTION_KEY if it exists
  const encryptionKey = variables.find(v => v.key === 'ENCRYPTION_KEY')
  if (encryptionKey) {
    content += `${encryptionKey.key}=${encryptionKey.value}\n\n`
  } else {
    // Keep the default from original .env
    content += `ENCRYPTION_KEY=c4f3d2e1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3\n\n`
  }

  // Group variables by category
  const databaseVars = variables.filter(v =>
    v.key.startsWith('DATABASE_')
  )
  const serverVars = variables.filter(v =>
    v.key.includes('PORT') || v.key.includes('HOST')
  )
  const aiVars = variables.filter(v =>
    v.key.includes('API_KEY') &&
    !v.key.includes('RAILWAY') &&
    v.key !== 'ENCRYPTION_KEY'
  )
  const railwayVars = variables.filter(v =>
    v.key.includes('RAILWAY')
  )
  const otherVars = variables.filter(v =>
    !databaseVars.includes(v) &&
    !serverVars.includes(v) &&
    !aiVars.includes(v) &&
    !railwayVars.includes(v) &&
    v.key !== 'ENCRYPTION_KEY'
  )

  // Add database configuration
  if (databaseVars.length > 0) {
    content += `# ===========================================
# DATABASE CONFIGURATION
# ===========================================
# Neon PostgreSQL connection strings
# - Pooled (for runtime): ends with -pooler.region.neon.tech
# - Direct (for migrations): without -pooler\n\n`

    for (const variable of databaseVars) {
      if (variable.description) {
        content += `# ${variable.description}\n`
      }
      content += `${variable.key}=${variable.value}\n`
    }
    content += '\n'
  }

  // Add server configuration
  if (serverVars.length > 0) {
    content += `# ===========================================
# SERVER CONFIGURATION
# ===========================================\n`

    for (const variable of serverVars) {
      if (variable.description) {
        content += `# ${variable.description}\n`
      }
      content += `${variable.key}=${variable.value}\n`
    }
    content += '\n'
  } else {
    // Add defaults if not present
    content += `# ===========================================
# SERVER CONFIGURATION
# ===========================================
HTTP_PORT=:8080
GRPC_PORT=:50051

`
  }

  // Add AI API keys
  if (aiVars.length > 0) {
    content += `# ===========================================
# AI API KEYS
# ===========================================
# API keys for AI service providers\n\n`

    for (const variable of aiVars) {
      if (variable.description) {
        content += `# ${variable.description}\n`
      }
      content += `${variable.key}=${variable.value}\n`
    }
    content += '\n'
  }

  // Add Railway configuration
  if (railwayVars.length > 0) {
    content += `# ===========================================
# RAILWAY CONFIGURATION
# ===========================================
# Railway deployment configuration\n\n`

    for (const variable of railwayVars) {
      if (variable.description) {
        content += `# ${variable.description}\n`
      }
      content += `${variable.key}=${variable.value}\n`
    }
    content += '\n'
  }

  // Add other variables
  if (otherVars.length > 0) {
    content += `# ===========================================
# OTHER CONFIGURATION
# ===========================================\n`

    for (const variable of otherVars) {
      if (variable.description) {
        content += `# ${variable.description}\n`
      }
      content += `${variable.key}=${variable.value}\n`
    }
    content += '\n'
  }

  return content
}

/**
 * Preview what will be exported without writing the file
 */
export async function previewEnvFile(): Promise<{
  success: boolean
  content?: string
  error?: string
}> {
  try {
    const envVarsResponse = await getEnvironmentVariables()

    if (!envVarsResponse.success || !envVarsResponse.variables) {
      return {
        success: false,
        error: envVarsResponse.error
      }
    }

    const content = generateEnvFileContent(envVarsResponse.variables)

    return {
      success: true,
      content
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
