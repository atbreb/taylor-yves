import { validateRailwayConfig, escapeGraphQL, syncToRailway } from '../client'

// Mock fetch for API tests
global.fetch = jest.fn()

describe('Railway Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('escapeGraphQL', () => {
    it('should escape backslashes', () => {
      expect(escapeGraphQL('path\\to\\file')).toBe('path\\\\to\\\\file')
    })

    it('should escape double quotes', () => {
      expect(escapeGraphQL('Hello "World"')).toBe('Hello \\"World\\"')
    })

    it('should escape newlines', () => {
      expect(escapeGraphQL('Line 1\nLine 2')).toBe('Line 1\\nLine 2')
    })

    it('should escape carriage returns', () => {
      expect(escapeGraphQL('Line 1\rLine 2')).toBe('Line 1\\rLine 2')
    })

    it('should escape tabs', () => {
      expect(escapeGraphQL('Column1\tColumn2')).toBe('Column1\\tColumn2')
    })

    it('should escape multiple special characters', () => {
      const input = 'Path: "C:\\Users\\test"\nLine 2\tTab'
      const expected = 'Path: \\"C:\\\\Users\\\\test\\"\\nLine 2\\tTab'
      expect(escapeGraphQL(input)).toBe(expected)
    })

    it('should handle empty string', () => {
      expect(escapeGraphQL('')).toBe('')
    })

    it('should handle string with no special characters', () => {
      expect(escapeGraphQL('Hello World 123')).toBe('Hello World 123')
    })

    it('should handle string with only special characters', () => {
      expect(escapeGraphQL('"\n\r\t\\')).toBe('\\"\\n\\r\\t\\\\')
    })
  })

  describe('validateRailwayConfig', () => {
    it('should validate complete valid configuration', () => {
      const config = {
        apiToken: 'railway_abc123def456',
        projectId: 'project-12345-67890'
      }

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject config without API token', () => {
      const config = {
        projectId: 'project-12345-67890'
      }

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Railway API token is required')
    })

    it('should reject API token not starting with "railway_"', () => {
      const config = {
        apiToken: 'invalid_token_format',
        projectId: 'project-12345-67890'
      }

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Railway API token should start with "railway_"')
    })

    it('should reject config without project ID', () => {
      const config = {
        apiToken: 'railway_abc123def456'
      }

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Railway project ID is required')
    })

    it('should reject project ID that is too short', () => {
      const config = {
        apiToken: 'railway_abc123def456',
        projectId: 'short'
      }

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Railway project ID appears invalid')
    })

    it('should accept project ID exactly 10 characters', () => {
      const config = {
        apiToken: 'railway_abc123def456',
        projectId: '1234567890'
      }

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should collect multiple errors', () => {
      const config = {
        apiToken: 'invalid',
        projectId: 'short'
      }

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain('Railway API token should start with "railway_"')
      expect(result.errors).toContain('Railway project ID appears invalid')
    })

    it('should handle empty config object', () => {
      const config = {}

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain('Railway API token is required')
      expect(result.errors).toContain('Railway project ID is required')
    })

    it('should accept environmentId as optional field', () => {
      const config = {
        apiToken: 'railway_abc123def456',
        projectId: 'project-12345-67890',
        environmentId: 'env-prod-123'
      }

      const result = validateRailwayConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
  })

  describe('syncToRailway', () => {
    it('should return error when API token is missing', async () => {
      const config = {
        apiToken: '',
        projectId: 'project-123'
      }
      const variables = [{ key: 'TEST_VAR', value: 'test' }]

      const result = await syncToRailway(config, variables)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Railway API token is required')
      expect(result.error).toBe('MISSING_TOKEN')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should return error when project ID is missing', async () => {
      const config = {
        apiToken: 'railway_test',
        projectId: ''
      }
      const variables = [{ key: 'TEST_VAR', value: 'test' }]

      const result = await syncToRailway(config, variables)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Railway project ID is required')
      expect(result.error).toBe('MISSING_PROJECT_ID')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should make API call with correct headers and body', async () => {
      const config = {
        apiToken: 'railway_test123',
        projectId: 'project-456'
      }
      const variables = [
        { key: 'DB_URL', value: 'postgresql://localhost' },
        { key: 'API_KEY', value: 'secret-key-123' }
      ]

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} })
      })

      const result = await syncToRailway(config, variables)

      expect(fetch).toHaveBeenCalledWith(
        'https://backboard.railway.app/graphql/v2',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer railway_test123'
          }
        })
      )

      expect(result.success).toBe(true)
    })

    it('should handle HTTP error responses', async () => {
      const config = {
        apiToken: 'railway_test',
        projectId: 'project-123'
      }
      const variables = [{ key: 'TEST', value: 'value' }]

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      })

      const result = await syncToRailway(config, variables)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Railway API error: 401')
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle GraphQL errors in response', async () => {
      const config = {
        apiToken: 'railway_test',
        projectId: 'project-123'
      }
      const variables = [{ key: 'TEST', value: 'value' }]

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Project not found' }]
        })
      })

      const result = await syncToRailway(config, variables)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to sync variables to Railway')
      expect(result.error).toContain('Project not found')
    })

    it('should handle network errors', async () => {
      const config = {
        apiToken: 'railway_test',
        projectId: 'project-123'
      }
      const variables = [{ key: 'TEST', value: 'value' }]

      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network failure'))

      const result = await syncToRailway(config, variables)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Network error connecting to Railway')
      expect(result.error).toBe('Network failure')
    })

    it('should escape special characters in variable values', async () => {
      const config = {
        apiToken: 'railway_test',
        projectId: 'project-123'
      }
      const variables = [
        { key: 'DB_URL', value: 'postgresql://user:p"a\ns\ts\\word@localhost' }
      ]

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} })
      })

      await syncToRailway(config, variables)

      const callArgs = (fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      const query = body.query

      // Verify GraphQL escaping is applied
      expect(query).toContain('\\"')  // escaped quotes
      expect(query).toContain('\\n')  // escaped newlines
      expect(query).toContain('\\t')  // escaped tabs
      expect(query).toContain('\\\\') // escaped backslashes
    })
  })
})
