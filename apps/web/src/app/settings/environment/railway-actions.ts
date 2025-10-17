'use server'

/**
 * Server Actions for Railway Integration
 *
 * These actions sync environment variables from our encrypted storage
 * to Railway deployments via their GraphQL API.
 */

import { syncToRailway, getRailwayVariables, triggerRailwayDeployment, validateRailwayConfig } from '@/lib/railway/client'
import type { RailwayConfig, EnvironmentVariable } from '@/lib/railway/client'
import { getEnvironmentVariables } from './actions'

interface RailwaySyncResponse {
  success: boolean
  message: string
  error?: string
  synced_count?: number
}

/**
 * Sync all environment variables to Railway
 */
export async function syncAllToRailway(
  railwayApiToken: string,
  railwayProjectId: string,
  railwayEnvironmentId?: string
): Promise<RailwaySyncResponse> {
  try {
    // Validate Railway configuration
    const validation = validateRailwayConfig({
      apiToken: railwayApiToken,
      projectId: railwayProjectId
    })

    if (!validation.valid) {
      return {
        success: false,
        message: 'Invalid Railway configuration',
        error: validation.errors.join(', ')
      }
    }

    // Get all environment variables from our encrypted storage
    const envVarsResponse = await getEnvironmentVariables()

    if (!envVarsResponse.success || !envVarsResponse.variables) {
      return {
        success: false,
        message: 'Failed to retrieve environment variables',
        error: envVarsResponse.error
      }
    }

    // Convert to Railway format
    const railwayVariables: EnvironmentVariable[] = envVarsResponse.variables.map(v => ({
      key: v.key,
      value: v.value
    }))

    // Sync to Railway
    const config: RailwayConfig = {
      apiToken: railwayApiToken,
      projectId: railwayProjectId,
      environmentId: railwayEnvironmentId
    }

    const result = await syncToRailway(config, railwayVariables)

    if (result.success) {
      return {
        success: true,
        message: result.message,
        synced_count: railwayVariables.length
      }
    } else {
      return {
        success: false,
        message: result.message,
        error: result.error
      }
    }
  } catch (error) {
    console.error('Railway sync error:', error)
    return {
      success: false,
      message: 'Failed to sync to Railway',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Sync specific environment variables to Railway
 */
export async function syncSpecificToRailway(
  railwayApiToken: string,
  railwayProjectId: string,
  variableKeys: string[],
  railwayEnvironmentId?: string
): Promise<RailwaySyncResponse> {
  try {
    // Validate Railway configuration
    const validation = validateRailwayConfig({
      apiToken: railwayApiToken,
      projectId: railwayProjectId
    })

    if (!validation.valid) {
      return {
        success: false,
        message: 'Invalid Railway configuration',
        error: validation.errors.join(', ')
      }
    }

    // Get all environment variables
    const envVarsResponse = await getEnvironmentVariables()

    if (!envVarsResponse.success || !envVarsResponse.variables) {
      return {
        success: false,
        message: 'Failed to retrieve environment variables',
        error: envVarsResponse.error
      }
    }

    // Filter to only requested keys
    const filteredVariables = envVarsResponse.variables.filter(v =>
      variableKeys.includes(v.key)
    )

    if (filteredVariables.length === 0) {
      return {
        success: false,
        message: 'No matching variables found',
        error: 'None of the specified keys were found in the environment'
      }
    }

    // Convert to Railway format
    const railwayVariables: EnvironmentVariable[] = filteredVariables.map(v => ({
      key: v.key,
      value: v.value
    }))

    // Sync to Railway
    const config: RailwayConfig = {
      apiToken: railwayApiToken,
      projectId: railwayProjectId,
      environmentId: railwayEnvironmentId
    }

    const result = await syncToRailway(config, railwayVariables)

    if (result.success) {
      return {
        success: true,
        message: result.message,
        synced_count: railwayVariables.length
      }
    } else {
      return {
        success: false,
        message: result.message,
        error: result.error
      }
    }
  } catch (error) {
    console.error('Railway sync error:', error)
    return {
      success: false,
      message: 'Failed to sync to Railway',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Compare local environment variables with Railway
 */
export async function compareWithRailway(
  railwayApiToken: string,
  railwayProjectId: string,
  railwayEnvironmentId?: string
): Promise<{
  success: boolean
  message?: string
  error?: string
  local_only?: string[]
  railway_only?: string[]
  different_values?: string[]
  matching?: string[]
}> {
  try {
    // Validate Railway configuration
    const validation = validateRailwayConfig({
      apiToken: railwayApiToken,
      projectId: railwayProjectId
    })

    if (!validation.valid) {
      return {
        success: false,
        message: 'Invalid Railway configuration',
        error: validation.errors.join(', ')
      }
    }

    // Get local variables
    const localResponse = await getEnvironmentVariables()
    if (!localResponse.success || !localResponse.variables) {
      return {
        success: false,
        error: 'Failed to retrieve local environment variables'
      }
    }

    // Get Railway variables
    const config: RailwayConfig = {
      apiToken: railwayApiToken,
      projectId: railwayProjectId,
      environmentId: railwayEnvironmentId
    }

    const railwayResponse = await getRailwayVariables(config)
    if (!railwayResponse.success || !railwayResponse.variables) {
      return {
        success: false,
        error: 'Failed to retrieve Railway variables'
      }
    }

    // Build comparison maps
    const localMap = new Map(localResponse.variables.map(v => [v.key, v.value]))
    const railwayMap = new Map(railwayResponse.variables.map(v => [v.key, v.value]))

    const localOnly: string[] = []
    const railwayOnly: string[] = []
    const differentValues: string[] = []
    const matching: string[] = []

    // Check local variables
    for (const [key, localValue] of localMap) {
      if (!railwayMap.has(key)) {
        localOnly.push(key)
      } else if (railwayMap.get(key) !== localValue) {
        differentValues.push(key)
      } else {
        matching.push(key)
      }
    }

    // Check Railway-only variables
    for (const key of railwayMap.keys()) {
      if (!localMap.has(key)) {
        railwayOnly.push(key)
      }
    }

    return {
      success: true,
      local_only: localOnly,
      railway_only: railwayOnly,
      different_values: differentValues,
      matching
    }
  } catch (error) {
    console.error('Railway comparison error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Trigger a Railway deployment after syncing variables
 */
export async function syncAndDeploy(
  railwayApiToken: string,
  railwayProjectId: string,
  railwayEnvironmentId?: string
): Promise<RailwaySyncResponse> {
  try {
    // First sync all variables
    const syncResult = await syncAllToRailway(
      railwayApiToken,
      railwayProjectId,
      railwayEnvironmentId
    )

    if (!syncResult.success) {
      return syncResult
    }

    // Then trigger deployment
    const config: RailwayConfig = {
      apiToken: railwayApiToken,
      projectId: railwayProjectId,
      environmentId: railwayEnvironmentId
    }

    const deployResult = await triggerRailwayDeployment(config)

    if (deployResult.success) {
      return {
        success: true,
        message: `Synced ${syncResult.synced_count} variables and triggered deployment`,
        synced_count: syncResult.synced_count
      }
    } else {
      return {
        success: false,
        message: `Variables synced but deployment failed: ${deployResult.message}`,
        error: deployResult.error
      }
    }
  } catch (error) {
    console.error('Railway sync and deploy error:', error)
    return {
      success: false,
      message: 'Failed to sync and deploy to Railway',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test Railway connection
 */
export async function testRailwayConnection(
  railwayApiToken: string,
  railwayProjectId: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    // Validate configuration
    const validation = validateRailwayConfig({
      apiToken: railwayApiToken,
      projectId: railwayProjectId
    })

    if (!validation.valid) {
      return {
        success: false,
        message: 'Invalid Railway configuration',
        error: validation.errors.join(', ')
      }
    }

    // Try to get variables as a connection test
    const config: RailwayConfig = {
      apiToken: railwayApiToken,
      projectId: railwayProjectId
    }

    const result = await getRailwayVariables(config)

    if (result.success) {
      return {
        success: true,
        message: `Successfully connected to Railway. Found ${result.variables?.length || 0} variables.`
      }
    } else {
      return {
        success: false,
        message: 'Failed to connect to Railway',
        error: result.error
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
