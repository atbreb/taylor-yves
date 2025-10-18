/**
 * Railway API Client
 *
 * Integrates with Railway's GraphQL API to manage environment variables
 * programmatically. This allows syncing environment variables from the
 * UI directly to your Railway deployments.
 *
 * Railway API Docs: https://docs.railway.app/reference/public-api
 */

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2'

export interface RailwayConfig {
  apiToken: string
  projectId: string
  environmentId?: string // Optional: defaults to production
}

export interface EnvironmentVariable {
  key: string
  value: string
}

export interface RailwayResponse {
  success: boolean
  message: string
  error?: string
}

/**
 * Upsert (create or update) environment variables in Railway
 */
export async function syncToRailway(
  config: RailwayConfig,
  variables: EnvironmentVariable[]
): Promise<RailwayResponse> {
  try {
    const { apiToken, projectId, environmentId } = config

    if (!apiToken) {
      return {
        success: false,
        message: 'Railway API token is required',
        error: 'MISSING_TOKEN'
      }
    }

    if (!projectId) {
      return {
        success: false,
        message: 'Railway project ID is required',
        error: 'MISSING_PROJECT_ID'
      }
    }

    // GraphQL mutation to upsert variables
    const mutations = variables.map((v, index) => `
      var${index}: variableUpsert(input: {
        projectId: "${projectId}"
        ${environmentId ? `environmentId: "${environmentId}"` : ''}
        name: "${escapeGraphQL(v.key)}"
        value: "${escapeGraphQL(v.value)}"
      }) {
        id
      }
    `).join('\n')

    const query = `
      mutation UpsertVariables {
        ${mutations}
      }
    `

    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        message: `Railway API error: ${response.status}`,
        error: errorText
      }
    }

    const data = await response.json()

    if (data.errors) {
      return {
        success: false,
        message: 'Failed to sync variables to Railway',
        error: JSON.stringify(data.errors)
      }
    }

    return {
      success: true,
      message: `Successfully synced ${variables.length} variable(s) to Railway`
    }
  } catch (error) {
    console.error('Railway sync error:', error)
    return {
      success: false,
      message: 'Network error connecting to Railway',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all environment variables from Railway
 */
export async function getRailwayVariables(
  config: RailwayConfig
): Promise<{ success: boolean; variables?: EnvironmentVariable[]; error?: string }> {
  try {
    const { apiToken, projectId, environmentId } = config

    const query = `
      query GetVariables($projectId: String!, $environmentId: String) {
        variables(projectId: $projectId, environmentId: $environmentId) {
          edges {
            node {
              id
              name
              value
            }
          }
        }
      }
    `

    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        query,
        variables: {
          projectId,
          environmentId: environmentId || null
        }
      })
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Railway API error: ${response.status}`
      }
    }

    const data = await response.json()

    if (data.errors) {
      return {
        success: false,
        error: JSON.stringify(data.errors)
      }
    }

    const variables = data.data?.variables?.edges?.map((edge: any) => ({
      key: edge.node.name,
      value: edge.node.value
    })) || []

    return {
      success: true,
      variables
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete environment variables from Railway
 */
export async function deleteRailwayVariables(
  config: RailwayConfig,
  variableIds: string[]
): Promise<RailwayResponse> {
  try {
    const { apiToken } = config

    const mutations = variableIds.map((id, index) => `
      var${index}: variableDelete(id: "${id}")
    `).join('\n')

    const query = `
      mutation DeleteVariables {
        ${mutations}
      }
    `

    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Railway API error: ${response.status}`
      }
    }

    const data = await response.json()

    if (data.errors) {
      return {
        success: false,
        message: 'Failed to delete variables from Railway',
        error: JSON.stringify(data.errors)
      }
    }

    return {
      success: true,
      message: `Successfully deleted ${variableIds.length} variable(s) from Railway`
    }
  } catch (error) {
    return {
      success: false,
      message: 'Network error connecting to Railway',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Trigger a Railway deployment
 */
export async function triggerRailwayDeployment(
  config: RailwayConfig
): Promise<RailwayResponse> {
  try {
    const { apiToken, projectId, environmentId } = config

    const query = `
      mutation DeployEnvironmentTriggers($projectId: String!, $environmentId: String) {
        deploymentTrigger(input: {
          projectId: $projectId
          environmentId: $environmentId
        }) {
          id
        }
      }
    `

    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        query,
        variables: {
          projectId,
          environmentId: environmentId || null
        }
      })
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Railway API error: ${response.status}`
      }
    }

    const data = await response.json()

    if (data.errors) {
      return {
        success: false,
        message: 'Failed to trigger Railway deployment',
        error: JSON.stringify(data.errors)
      }
    }

    return {
      success: true,
      message: 'Successfully triggered Railway deployment'
    }
  } catch (error) {
    return {
      success: false,
      message: 'Network error connecting to Railway',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Escape special characters for GraphQL strings
 */
export function escapeGraphQL(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

/**
 * Validate Railway configuration
 */
export function validateRailwayConfig(config: Partial<RailwayConfig>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.apiToken) {
    errors.push('Railway API token is required')
  } else if (!config.apiToken.startsWith('railway_')) {
    errors.push('Railway API token should start with "railway_"')
  }

  if (!config.projectId) {
    errors.push('Railway project ID is required')
  } else if (config.projectId.length < 10) {
    errors.push('Railway project ID appears invalid')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
