'use server'

import { cookies } from 'next/headers'
import crypto from 'crypto'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'

// Auto-generate encryption key if not provided (store it for consistency)
const getEncryptionKey = (): string => {
  if (process.env.ENCRYPTION_KEY) {
    return process.env.ENCRYPTION_KEY
  }
  
  // Try to read from a local file
  const keyPath = path.join(process.cwd(), '.encryption.key')
  try {
    return fsSync.readFileSync(keyPath, 'utf-8').trim()
  } catch {
    // Generate a new key and save it
    const newKey = crypto.randomBytes(32).toString('hex')
    try {
      fsSync.writeFileSync(keyPath, newKey, 'utf-8')
      console.log('📔 Generated new encryption key and saved to .encryption.key')
      console.log('⚠️  For production, set ENCRYPTION_KEY environment variable')
    } catch (writeError) {
      console.error('Could not save encryption key:', writeError)
    }
    return newKey
  }
}

const ENCRYPTION_KEY = getEncryptionKey()
const STORAGE_PATH = process.env.ENV_STORAGE_PATH || path.join(process.cwd(), '.env.local.encrypted')

interface EnvironmentVariable {
  id: string
  key: string
  value: string
  description?: string
  isSecret: boolean
}

interface EnvironmentGroup {
  id: string
  name: string
  description?: string
  icon?: string
  variables: EnvironmentVariable[]
  createdAt: string
  updatedAt: string
}

// AES-256-GCM encryption for better security
function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16)
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex')
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer.subarray(0, 32), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

function decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
  try {
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex')
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm', 
      keyBuffer.subarray(0, 32), 
      Buffer.from(encryptedData.iv, 'hex')
    )
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}

export async function saveEnvironmentGroups(groups: EnvironmentGroup[]) {
  try {
    // Encrypt sensitive values
    const encryptedGroups = groups.map(group => ({
      ...group,
      variables: group.variables.map(variable => ({
        ...variable,
        value: variable.isSecret 
          ? JSON.stringify(encrypt(variable.value))
          : variable.value
      }))
    }))

    // Save to file system (in production, use a secure database)
    await fs.writeFile(
      STORAGE_PATH,
      JSON.stringify(encryptedGroups, null, 2),
      'utf-8'
    )

    // Also update process.env for current session
    groups.forEach(group => {
      group.variables.forEach(variable => {
        if (variable.key) {
          process.env[variable.key] = variable.value
        }
      })
    })

    // For specific known variables, also set in cookies for client access
    const cookieStore = cookies()
    groups.forEach(group => {
      if (group.id === 'database') {
        const pooledUrl = group.variables.find(v => v.key === 'DATABASE_URL_POOLED')
        const directUrl = group.variables.find(v => v.key === 'DATABASE_URL_DIRECT')
        
        if (pooledUrl) {
          const encrypted = encrypt(pooledUrl.value)
          cookieStore.set('db_pooled', JSON.stringify(encrypted), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30
          })
        }
        
        if (directUrl) {
          const encrypted = encrypt(directUrl.value)
          cookieStore.set('db_direct', JSON.stringify(encrypted), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 30
          })
        }
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to save environment groups:', error)
    throw new Error('Failed to save environment groups')
  }
}

export async function getEnvironmentGroups(): Promise<EnvironmentGroup[]> {
  try {
    // Try to read from file system
    try {
      const data = await fs.readFile(STORAGE_PATH, 'utf-8')
      const groups = JSON.parse(data) as EnvironmentGroup[]

      console.log('📂 Loaded environment groups from storage')

      // Decrypt sensitive values
      return groups.map(group => ({
        ...group,
        variables: group.variables.map(variable => {
          if (variable.isSecret && variable.value) {
            try {
              const encryptedData = JSON.parse(variable.value)
              return {
                ...variable,
                value: decrypt(encryptedData)
              }
            } catch {
              return variable
            }
          }
          return variable
        })
      }))
    } catch (fileError) {
      // File doesn't exist, return default structure
      console.log('📋 No saved environment groups found, using defaults')
      return getDefaultGroups()
    }
  } catch (error) {
    console.error('❌ Failed to load environment groups:', error)
    console.log('📋 Falling back to default groups')
    return getDefaultGroups()
  }
}

function getDefaultGroups(): EnvironmentGroup[] {
  const now = new Date().toISOString()
  
  return [
    {
      id: 'database',
      name: 'Database',
      description: 'Database connection settings',
      icon: '🗄️',
      variables: [
        {
          id: crypto.randomUUID(),
          key: 'DATABASE_URL_POOLED',
          value: process.env.DATABASE_URL_POOLED || '',
          description: 'Pooled connection for runtime queries (with -pooler suffix)',
          isSecret: true
        },
        {
          id: crypto.randomUUID(),
          key: 'DATABASE_URL_DIRECT',
          value: process.env.DATABASE_URL_DIRECT || '',
          description: 'Direct connection for migrations (without pooler)',
          isSecret: true
        }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'ai-providers',
      name: 'AI Providers',
      description: 'AI service API keys',
      icon: '🤖',
      variables: [
        {
          id: crypto.randomUUID(),
          key: 'OPENAI_API_KEY',
          value: process.env.OPENAI_API_KEY || '',
          description: 'OpenAI API key for GPT models',
          isSecret: true
        },
        {
          id: crypto.randomUUID(),
          key: 'ANTHROPIC_API_KEY',
          value: process.env.ANTHROPIC_API_KEY || '',
          description: 'Anthropic API key for Claude models',
          isSecret: true
        },
        {
          id: crypto.randomUUID(),
          key: 'GOOGLE_API_KEY',
          value: process.env.GOOGLE_API_KEY || '',
          description: 'Google AI API key for Gemini models',
          isSecret: true
        },
        {
          id: crypto.randomUUID(),
          key: 'META_API_KEY',
          value: process.env.META_API_KEY || '',
          description: 'Meta API key for Llama models',
          isSecret: true
        }
      ],
      createdAt: now,
      updatedAt: now
    }
  ]
}

export async function testConnection(connectionString: string): Promise<{ success: boolean; message: string }> {
  try {
    // Parse the connection string to validate format
    const url = new URL(connectionString)
    
    if (!url.protocol.startsWith('postgresql:') && !url.protocol.startsWith('postgres:')) {
      return { success: false, message: 'Invalid PostgreSQL connection string' }
    }

    // In a real implementation, you would actually test the connection
    // For now, we'll just validate the format
    if (url.hostname && url.pathname) {
      return { 
        success: true, 
        message: `Connection string appears valid for ${url.hostname}${url.pathname}` 
      }
    }

    return { success: false, message: 'Invalid connection string format' }
  } catch (error) {
    return { success: false, message: `Invalid URL format: ${error}` }
  }
}

export async function deleteGroup(groupId: string): Promise<void> {
  const groups = await getEnvironmentGroups()
  const filteredGroups = groups.filter(g => g.id !== groupId)
  await saveEnvironmentGroups(filteredGroups)
}

export async function exportGroups(groups: EnvironmentGroup[]): Promise<string> {
  // Remove sensitive values for export
  const exportData = groups.map(group => ({
    ...group,
    variables: group.variables.map(variable => ({
      ...variable,
      value: variable.isSecret ? '' : variable.value
    }))
  }))
  
  return JSON.stringify(exportData, null, 2)
}

export async function importGroups(jsonContent: string): Promise<EnvironmentGroup[]> {
  try {
    const imported = JSON.parse(jsonContent) as EnvironmentGroup[]
    
    // Validate structure
    if (!Array.isArray(imported)) {
      throw new Error('Invalid import format')
    }
    
    // Merge with existing sensitive values
    const existing = await getEnvironmentGroups()
    
    return imported.map(group => {
      const existingGroup = existing.find(g => g.id === group.id)
      
      return {
        ...group,
        variables: group.variables.map(variable => {
          // Preserve existing secret values if not provided in import
          if (variable.isSecret && !variable.value && existingGroup) {
            const existingVar = existingGroup.variables.find(v => v.key === variable.key)
            if (existingVar) {
              return { ...variable, value: existingVar.value }
            }
          }
          return variable
        }),
        updatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    throw new Error(`Failed to import: ${error}`)
  }
}

export async function getEnvironmentVariable(key: string): Promise<string | null> {
  try {
    // First check process.env
    if (process.env[key]) {
      return process.env[key]!
    }

    // Then check stored groups
    const groups = await getEnvironmentGroups()
    for (const group of groups) {
      const variable = group.variables.find(v => v.key === key)
      if (variable) {
        return variable.value
      }
    }

    return null
  } catch (error) {
    console.error(`Failed to get environment variable ${key}:`, error)
    return null
  }
}