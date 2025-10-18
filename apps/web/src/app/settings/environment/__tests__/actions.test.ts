// Set encryption key before any modules load
process.env.ENCRYPTION_KEY = 'a'.repeat(64) // 64 hex characters = 32 bytes

import {
  testConnection,
  exportGroups,
  importGroups,
  getEnvironmentVariable,
} from '../actions'

describe('Environment Actions (Simple Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset environment variables
    delete process.env.TEST_KEY
    delete process.env.SECRET_KEY
    delete process.env.DATABASE_URL_POOLED
    delete process.env.DATABASE_URL_DIRECT
  })

  describe('testConnection', () => {
    it('should validate a valid PostgreSQL connection string', async () => {
      const result = await testConnection('postgresql://user:pass@localhost:5432/mydb')

      expect(result.success).toBe(true)
      expect(result.message).toContain('valid')
    })

    it('should validate postgres:// protocol', async () => {
      const result = await testConnection('postgres://user:pass@localhost:5432/mydb')

      expect(result.success).toBe(true)
      expect(result.message).toContain('valid')
    })

    it('should detect Neon connections', async () => {
      const result = await testConnection(
        'postgresql://user:pass@ep-test.neon.tech:5432/mydb'
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Neon PostgreSQL')
    })

    it('should detect pooled Neon connections', async () => {
      const result = await testConnection(
        'postgresql://user:pass@ep-test-pooler.neon.tech:5432/mydb'
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Pooled connection')
    })

    it('should reject invalid protocol', async () => {
      const result = await testConnection('mysql://user:pass@localhost:3306/mydb')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid PostgreSQL connection string')
    })

    it('should reject connection string without hostname (empty)', async () => {
      const result = await testConnection('postgresql://user:pass@/mydb')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid URL format')
    })

    it('should reject connection string without database name', async () => {
      const result = await testConnection('postgresql://user:pass@localhost:5432')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Missing database name')
    })

    it('should reject connection string without database name (with trailing slash)', async () => {
      const result = await testConnection('postgresql://user:pass@localhost:5432/')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Missing database name')
    })

    it('should reject connection string without username', async () => {
      const result = await testConnection('postgresql://:pass@localhost:5432/mydb')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Missing username')
    })

    it('should handle malformed URLs', async () => {
      const result = await testConnection('not-a-valid-url')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid URL format')
    })
  })

  describe('exportGroups', () => {
    const mockGroup = {
      id: 'test-group',
      name: 'Test Group',
      description: 'Test description',
      icon: '🧪',
      variables: [
        {
          id: 'var-1',
          key: 'TEST_KEY',
          value: 'test-value',
          description: 'Test variable',
          isSecret: false,
        },
        {
          id: 'var-2',
          key: 'SECRET_KEY',
          value: 'secret-value',
          description: 'Secret variable',
          isSecret: true,
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    it('should export groups without secret values', async () => {
      const exported = await exportGroups([mockGroup])
      const parsed = JSON.parse(exported)

      expect(parsed[0].variables.find((v: any) => v.key === 'TEST_KEY').value).toBe('test-value')
      expect(parsed[0].variables.find((v: any) => v.key === 'SECRET_KEY').value).toBe('')
    })

    it('should preserve structure during export', async () => {
      const exported = await exportGroups([mockGroup])
      const parsed = JSON.parse(exported)

      expect(parsed[0].id).toBe(mockGroup.id)
      expect(parsed[0].name).toBe(mockGroup.name)
      expect(parsed[0].description).toBe(mockGroup.description)
      expect(parsed[0].variables).toHaveLength(2)
    })

    it('should format JSON with indentation', async () => {
      const exported = await exportGroups([mockGroup])

      expect(exported).toContain('\n')
      expect(exported).toContain('  ')
    })

    it('should handle multiple groups', async () => {
      const groups = [
        mockGroup,
        { ...mockGroup, id: 'group-2', name: 'Group 2' },
      ]

      const exported = await exportGroups(groups)
      const parsed = JSON.parse(exported)

      expect(parsed).toHaveLength(2)
      expect(parsed[0].id).toBe('test-group')
      expect(parsed[1].id).toBe('group-2')
    })

    it('should handle empty variables array', async () => {
      const emptyGroup = { ...mockGroup, variables: [] }
      const exported = await exportGroups([emptyGroup])
      const parsed = JSON.parse(exported)

      expect(parsed[0].variables).toEqual([])
    })
  })

  describe('importGroups', () => {
    const mockGroup = {
      id: 'test-group',
      name: 'Test Group',
      description: 'Test description',
      icon: '🧪',
      variables: [
        {
          id: 'var-1',
          key: 'TEST_KEY',
          value: 'test-value',
          description: 'Test variable',
          isSecret: false,
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    it('should import groups from JSON', async () => {
      const jsonContent = JSON.stringify([mockGroup])

      const result = await importGroups(jsonContent)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockGroup.id)
    })

    it('should update timestamps on import', async () => {
      const jsonContent = JSON.stringify([mockGroup])
      const beforeImport = new Date()

      const result = await importGroups(jsonContent)

      const afterImport = new Date()
      const updatedAt = new Date(result[0].updatedAt)

      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeImport.getTime())
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterImport.getTime())
    })

    it('should reject invalid JSON', async () => {
      await expect(importGroups('not-valid-json')).rejects.toThrow('Failed to import')
    })

    it('should reject non-array data', async () => {
      await expect(importGroups(JSON.stringify({ not: 'an-array' }))).rejects.toThrow(
        'Invalid import format'
      )
    })

    it('should handle empty array', async () => {
      const result = await importGroups('[]')
      expect(result).toEqual([])
    })

    it('should preserve non-secret values', async () => {
      const jsonContent = JSON.stringify([mockGroup])
      const result = await importGroups(jsonContent)

      const variable = result[0].variables[0]
      expect(variable.value).toBe('test-value')
    })
  })

  describe('getEnvironmentVariable', () => {
    it('should return variable from process.env', async () => {
      process.env.TEST_VAR = 'test-value'

      const result = await getEnvironmentVariable('TEST_VAR')

      expect(result).toBe('test-value')
    })

    it('should return null for non-existent variable', async () => {
      const result = await getEnvironmentVariable('NON_EXISTENT')

      expect(result).toBeNull()
    })

    it('should return null for variables with empty string values', async () => {
      process.env.EMPTY_VAR = ''

      const result = await getEnvironmentVariable('EMPTY_VAR')

      // Empty strings in process.env are treated as null by the function
      expect(result).toBeNull()
    })

    it('should handle special characters in variable values', async () => {
      const specialValue = 'test!@#$%^&*()_+-={}[]|:";\'<>?,./'
      process.env.SPECIAL_VAR = specialValue

      const result = await getEnvironmentVariable('SPECIAL_VAR')

      expect(result).toBe(specialValue)
    })
  })
})
