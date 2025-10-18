// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock fs modules
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
}))

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

// Mock the export-actions module
jest.mock('../export-actions', () => ({
  exportToEnvFile: jest.fn(() => Promise.resolve()),
}), { virtual: false })

import { cookies } from 'next/headers'
import {
  saveEnvironmentGroups,
  getEnvironmentGroups,
  testConnection,
  deleteGroup,
  exportGroups,
  importGroups,
  getEnvironmentVariable,
  getEnvironmentVariables,
} from '../actions'

// Get the mocked modules
const fs = jest.requireMock('fs/promises')
const fsSync = jest.requireMock('fs')

describe('Environment Actions', () => {
  let mockCookieStore: {
    get: jest.Mock
    set: jest.Mock
  }

  const mockEnvironmentGroup = {
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

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset environment variables
    delete process.env.TEST_KEY
    delete process.env.SECRET_KEY
    delete process.env.DATABASE_URL_POOLED
    delete process.env.DATABASE_URL_DIRECT
    delete process.env.ENCRYPTION_KEY
    delete process.env.ENV_STORAGE_PATH

    // Set a test encryption key to avoid file creation
    process.env.ENCRYPTION_KEY = 'a'.repeat(64) // 64 hex characters = 32 bytes

    // Create mock cookie store
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
    }

    ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)

    // Mock fs.writeFile to avoid actual file writes
    fs.writeFile.mockResolvedValue(undefined)

    // Mock fs.readFile to return default data
    fs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'))

    // Mock fsSync methods
    fsSync.readFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    fsSync.writeFileSync.mockImplementation(() => undefined)
  })

  describe('saveEnvironmentGroups', () => {
    it('should save environment groups to file system', async () => {
      const result = await saveEnvironmentGroups([mockEnvironmentGroup])

      expect(result.success).toBe(true)
      expect(fs.writeFile).toHaveBeenCalled()
    })

    it('should encrypt secret values', async () => {
      await saveEnvironmentGroups([mockEnvironmentGroup])

      const writeCall = fs.writeFile.mock.calls[0]
      const savedData = JSON.parse(writeCall[1])

      // Secret variable should be encrypted (JSON string format)
      const secretVar = savedData[0].variables.find((v: any) => v.key === 'SECRET_KEY')
      expect(secretVar.value).not.toBe('secret-value')
      expect(() => JSON.parse(secretVar.value)).not.toThrow()
    })

    it('should not encrypt non-secret values', async () => {
      await saveEnvironmentGroups([mockEnvironmentGroup])

      const writeCall = fs.writeFile.mock.calls[0]
      const savedData = JSON.parse(writeCall[1])

      const nonSecretVar = savedData[0].variables.find((v: any) => v.key === 'TEST_KEY')
      expect(nonSecretVar.value).toBe('test-value')
    })

    it('should update process.env with variable values', async () => {
      await saveEnvironmentGroups([mockEnvironmentGroup])

      expect(process.env.TEST_KEY).toBe('test-value')
      expect(process.env.SECRET_KEY).toBe('secret-value')
    })

    it('should set database URLs in cookies', async () => {
      const dbGroup = {
        id: 'database',
        name: 'Database',
        variables: [
          {
            id: 'db-1',
            key: 'DATABASE_URL_POOLED',
            value: 'postgresql://user:pass@host/db-pooler',
            isSecret: true,
          },
          {
            id: 'db-2',
            key: 'DATABASE_URL_DIRECT',
            value: 'postgresql://user:pass@host/db',
            isSecret: true,
          },
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      await saveEnvironmentGroups([dbGroup])

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'db_pooled',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        })
      )

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'db_direct',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        })
      )
    })

    it('should handle file write errors', async () => {
      ;fs.writeFile.mockRejectedValueOnce(new Error('Write failed'))

      await expect(saveEnvironmentGroups([mockEnvironmentGroup])).rejects.toThrow(
        'Failed to save environment groups'
      )
    })

    it('should skip variables without keys', async () => {
      const groupWithEmptyKey = {
        ...mockEnvironmentGroup,
        variables: [
          { id: 'var-1', key: '', value: 'test', isSecret: false },
          { id: 'var-2', key: 'VALID_KEY', value: 'test', isSecret: false },
        ],
      }

      await saveEnvironmentGroups([groupWithEmptyKey])

      expect(process.env.VALID_KEY).toBe('test')
      expect(process.env['']).toBeUndefined()
    })
  })

  describe('getEnvironmentGroups', () => {
    it('should load and decrypt environment groups from file', async () => {
      // First save to get encrypted data
      await saveEnvironmentGroups([mockEnvironmentGroup])
      const savedData = fs.writeFile.mock.calls[0][1]

      // Mock readFile to return the saved data
      ;fs.readFile.mockResolvedValueOnce(savedData)

      const result = await getEnvironmentGroups()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('test-group')
      expect(result[0].variables.find((v) => v.key === 'SECRET_KEY')?.value).toBe('secret-value')
    })

    it('should return default groups when file does not exist', async () => {
      const result = await getEnvironmentGroups()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result.some((g) => g.id === 'database')).toBe(true)
      expect(result.some((g) => g.id === 'ai-providers')).toBe(true)
    })

    it('should handle corrupted encrypted data gracefully', async () => {
      const corruptedData = JSON.stringify([
        {
          ...mockEnvironmentGroup,
          variables: [
            {
              id: 'var-1',
              key: 'TEST',
              value: 'invalid-encrypted-data',
              isSecret: true,
            },
          ],
        },
      ])

      ;fs.readFile.mockResolvedValueOnce(corruptedData)

      const result = await getEnvironmentGroups()

      // Should return the data with the corrupted value as-is
      expect(result[0].variables[0].value).toBe('invalid-encrypted-data')
    })

    it('should handle file read errors', async () => {
      ;fs.readFile.mockRejectedValueOnce(new Error('Permission denied'))

      const result = await getEnvironmentGroups()

      // Should fall back to default groups
      expect(Array.isArray(result)).toBe(true)
    })

    it('should decrypt only secret values', async () => {
      await saveEnvironmentGroups([mockEnvironmentGroup])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValueOnce(savedData)

      const result = await getEnvironmentGroups()

      const nonSecretVar = result[0].variables.find((v) => v.key === 'TEST_KEY')
      expect(nonSecretVar?.value).toBe('test-value')

      const secretVar = result[0].variables.find((v) => v.key === 'SECRET_KEY')
      expect(secretVar?.value).toBe('secret-value')
    })
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

    it('should reject connection string without hostname', async () => {
      const result = await testConnection('postgresql://user:pass@:5432/mydb')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Missing hostname')
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

  describe('deleteGroup', () => {
    it('should delete a group by id', async () => {
      // Setup: save two groups
      const group1 = { ...mockEnvironmentGroup, id: 'group-1' }
      const group2 = { ...mockEnvironmentGroup, id: 'group-2' }

      await saveEnvironmentGroups([group1, group2])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      // Delete group-1
      await deleteGroup('group-1')

      // Verify only group-2 remains
      const finalSaveCall = fs.writeFile.mock.calls[1]
      const finalData = JSON.parse(finalSaveCall[1])
      expect(finalData).toHaveLength(1)
      expect(finalData[0].id).toBe('group-2')
    })

    it('should handle deletion of non-existent group', async () => {
      await saveEnvironmentGroups([mockEnvironmentGroup])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      // Should not throw
      await expect(deleteGroup('non-existent-id')).resolves.not.toThrow()
    })
  })

  describe('exportGroups', () => {
    it('should export groups without secret values', async () => {
      const exported = await exportGroups([mockEnvironmentGroup])
      const parsed = JSON.parse(exported)

      expect(parsed[0].variables.find((v: any) => v.key === 'TEST_KEY').value).toBe('test-value')
      expect(parsed[0].variables.find((v: any) => v.key === 'SECRET_KEY').value).toBe('')
    })

    it('should preserve structure during export', async () => {
      const exported = await exportGroups([mockEnvironmentGroup])
      const parsed = JSON.parse(exported)

      expect(parsed[0].id).toBe(mockEnvironmentGroup.id)
      expect(parsed[0].name).toBe(mockEnvironmentGroup.name)
      expect(parsed[0].description).toBe(mockEnvironmentGroup.description)
      expect(parsed[0].variables).toHaveLength(2)
    })

    it('should format JSON with indentation', async () => {
      const exported = await exportGroups([mockEnvironmentGroup])

      expect(exported).toContain('\n')
      expect(exported).toContain('  ')
    })
  })

  describe('importGroups', () => {
    it('should import groups from JSON', async () => {
      const jsonContent = JSON.stringify([mockEnvironmentGroup])

      const result = await importGroups(jsonContent)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockEnvironmentGroup.id)
    })

    it('should preserve existing secret values when not provided', async () => {
      // Setup: save a group with a secret
      await saveEnvironmentGroups([mockEnvironmentGroup])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      // Import the same group but with empty secret value
      const importData = {
        ...mockEnvironmentGroup,
        variables: [
          ...mockEnvironmentGroup.variables.filter((v) => !v.isSecret),
          {
            id: 'var-2',
            key: 'SECRET_KEY',
            value: '', // Empty value
            description: 'Secret variable',
            isSecret: true,
          },
        ],
      }

      const result = await importGroups(JSON.stringify([importData]))

      // Should preserve the existing secret value
      const secretVar = result[0].variables.find((v) => v.key === 'SECRET_KEY')
      expect(secretVar?.value).toBe('secret-value')
    })

    it('should update timestamps on import', async () => {
      const jsonContent = JSON.stringify([mockEnvironmentGroup])
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
  })

  describe('getEnvironmentVariable', () => {
    it('should return variable from process.env', async () => {
      process.env.TEST_VAR = 'test-value'

      const result = await getEnvironmentVariable('TEST_VAR')

      expect(result).toBe('test-value')
    })

    it('should return variable from stored groups', async () => {
      await saveEnvironmentGroups([mockEnvironmentGroup])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      const result = await getEnvironmentVariable('TEST_KEY')

      expect(result).toBe('test-value')
    })

    it('should prioritize process.env over stored groups', async () => {
      process.env.TEST_KEY = 'from-env'

      await saveEnvironmentGroups([mockEnvironmentGroup])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      const result = await getEnvironmentVariable('TEST_KEY')

      expect(result).toBe('from-env')
    })

    it('should return null for non-existent variable', async () => {
      const result = await getEnvironmentVariable('NON_EXISTENT')

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      ;fs.readFile.mockRejectedValue(new Error('Read error'))

      const result = await getEnvironmentVariable('ANY_KEY')

      expect(result).toBeNull()
    })
  })

  describe('getEnvironmentVariables', () => {
    it('should return all variables from all groups', async () => {
      const groups = [
        mockEnvironmentGroup,
        {
          id: 'group-2',
          name: 'Group 2',
          variables: [
            {
              id: 'var-3',
              key: 'ANOTHER_KEY',
              value: 'another-value',
              isSecret: false,
            },
          ],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]

      await saveEnvironmentGroups(groups)
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      const result = await getEnvironmentVariables()

      expect(result.success).toBe(true)
      expect(result.variables).toHaveLength(3)
      expect(result.variables?.map((v) => v.key)).toContain('TEST_KEY')
      expect(result.variables?.map((v) => v.key)).toContain('SECRET_KEY')
      expect(result.variables?.map((v) => v.key)).toContain('ANOTHER_KEY')
    })

    it('should exclude variables with empty values', async () => {
      const groupWithEmpty = {
        ...mockEnvironmentGroup,
        variables: [
          { id: 'var-1', key: 'HAS_VALUE', value: 'test', isSecret: false },
          { id: 'var-2', key: 'EMPTY_VALUE', value: '', isSecret: false },
        ],
      }

      await saveEnvironmentGroups([groupWithEmpty])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      const result = await getEnvironmentVariables()

      expect(result.success).toBe(true)
      expect(result.variables).toHaveLength(1)
      expect(result.variables?.[0].key).toBe('HAS_VALUE')
    })

    it('should handle errors and return error response', async () => {
      ;fs.readFile.mockRejectedValue(new Error('File read error'))

      const result = await getEnvironmentVariables()

      // Should fall back to default groups and still succeed
      expect(result.success).toBe(true)
      expect(Array.isArray(result.variables)).toBe(true)
    })

    it('should return proper structure', async () => {
      await saveEnvironmentGroups([mockEnvironmentGroup])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      const result = await getEnvironmentVariables()

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('variables')
      expect(result.variables?.[0]).toHaveProperty('key')
      expect(result.variables?.[0]).toHaveProperty('value')
    })
  })

  describe('Encryption/Decryption', () => {
    it('should successfully encrypt and decrypt data', async () => {
      await saveEnvironmentGroups([mockEnvironmentGroup])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      const loaded = await getEnvironmentGroups()

      const secretVar = loaded[0].variables.find((v) => v.key === 'SECRET_KEY')
      expect(secretVar?.value).toBe('secret-value')
    })

    it('should handle special characters in encrypted values', async () => {
      const specialGroup = {
        ...mockEnvironmentGroup,
        variables: [
          {
            id: 'var-1',
            key: 'SPECIAL',
            value: 'special!@#$%^&*()_+-={}[]|:";\'<>?,./',
            isSecret: true,
          },
        ],
      }

      await saveEnvironmentGroups([specialGroup])
      const savedData = fs.writeFile.mock.calls[0][1]
      ;fs.readFile.mockResolvedValue(savedData)

      const loaded = await getEnvironmentGroups()

      expect(loaded[0].variables[0].value).toBe('special!@#$%^&*()_+-={}[]|:";\'<>?,./')
    })

    it('should use different IVs for each encryption', async () => {
      const group = {
        ...mockEnvironmentGroup,
        variables: [
          { id: 'var-1', key: 'KEY1', value: 'same-value', isSecret: true },
          { id: 'var-2', key: 'KEY2', value: 'same-value', isSecret: true },
        ],
      }

      await saveEnvironmentGroups([group])
      const savedData = JSON.parse(fs.writeFile.mock.calls[0][1])

      const encrypted1 = JSON.parse(savedData[0].variables[0].value)
      const encrypted2 = JSON.parse(savedData[0].variables[1].value)

      // Different IVs mean different encrypted values even for same plaintext
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
    })
  })
})
