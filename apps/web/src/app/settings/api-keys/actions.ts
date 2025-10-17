'use server'

import { cookies } from 'next/headers'
import crypto from 'crypto'

// In production, use a proper secret management service
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'

interface ApiKeyConfig {
  provider: string
  key: string
  isValid?: boolean
  lastTested?: string
}

// Simple encryption/decryption for demo purposes
// In production, use a proper KMS or secret management service
function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function decrypt(text: string): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
    let decrypted = decipher.update(text, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return ''
  }
}

export async function saveApiKeys(apiKeys: Record<string, ApiKeyConfig>) {
  try {
    // In production, save to a secure database
    // For demo, we'll use cookies (not recommended for production)
    const cookieStore = cookies()
    
    for (const [provider, config] of Object.entries(apiKeys)) {
      if (config.key) {
        const encryptedKey = encrypt(config.key)
        cookieStore.set(`api_key_${provider}`, encryptedKey, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
        
        // Also set as environment variable for the current session
        process.env[`${provider.toUpperCase()}_API_KEY`] = config.key
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to save API keys:', error)
    throw new Error('Failed to save API keys')
  }
}

export async function getApiKeys(): Promise<Record<string, ApiKeyConfig>> {
  try {
    const cookieStore = cookies()
    const providers = ['openai', 'anthropic', 'google', 'meta']
    const apiKeys: Record<string, ApiKeyConfig> = {}
    
    for (const provider of providers) {
      const encryptedKey = cookieStore.get(`api_key_${provider}`)?.value
      if (encryptedKey) {
        const decryptedKey = decrypt(encryptedKey)
        apiKeys[provider] = {
          provider,
          key: decryptedKey,
          isValid: undefined,
          lastTested: undefined
        }
      }
    }
    
    return apiKeys
  } catch (error) {
    console.error('Failed to load API keys:', error)
    return {}
  }
}

export async function testApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; message: string }> {
  try {
    switch (provider) {
      case 'openai':
        // Test OpenAI API key
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        })
        if (openaiResponse.ok) {
          return { valid: true, message: 'OpenAI API key is valid' }
        } else if (openaiResponse.status === 401) {
          return { valid: false, message: 'Invalid OpenAI API key' }
        } else {
          return { valid: false, message: `OpenAI API error: ${openaiResponse.status}` }
        }
        
      case 'anthropic':
        // Test Anthropic API key
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 1
          })
        })
        if (anthropicResponse.ok || anthropicResponse.status === 400) {
          return { valid: true, message: 'Anthropic API key is valid' }
        } else if (anthropicResponse.status === 401) {
          return { valid: false, message: 'Invalid Anthropic API key' }
        } else {
          return { valid: false, message: `Anthropic API error: ${anthropicResponse.status}` }
        }
        
      case 'google':
        // Test Google AI API key
        const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
        if (googleResponse.ok) {
          return { valid: true, message: 'Google AI API key is valid' }
        } else if (googleResponse.status === 403 || googleResponse.status === 400) {
          return { valid: false, message: 'Invalid Google AI API key' }
        } else {
          return { valid: false, message: `Google AI API error: ${googleResponse.status}` }
        }
        
      case 'meta':
        // Meta/Llama typically requires different setup (e.g., Replicate or local)
        // For now, just validate format
        if (apiKey.startsWith('meta-') || apiKey.startsWith('r8_')) {
          return { valid: true, message: 'Meta API key format is valid (actual validation depends on provider)' }
        } else {
          return { valid: false, message: 'Invalid Meta API key format' }
        }
        
      default:
        return { valid: false, message: 'Unknown provider' }
    }
  } catch (error) {
    console.error(`Failed to test ${provider} API key:`, error)
    return { valid: false, message: `Failed to test API key: ${error}` }
  }
}

export async function getActiveApiKey(provider: string): Promise<string | null> {
  try {
    const cookieStore = cookies()
    const encryptedKey = cookieStore.get(`api_key_${provider}`)?.value
    if (encryptedKey) {
      return decrypt(encryptedKey)
    }
    
    // Fallback to environment variable
    const envVarName = `${provider.toUpperCase()}_API_KEY`
    return process.env[envVarName] || null
  } catch (error) {
    console.error(`Failed to get ${provider} API key:`, error)
    return null
  }
}