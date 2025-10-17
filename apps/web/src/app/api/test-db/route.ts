import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json()

    if (!connectionString) {
      return NextResponse.json(
        { success: false, message: 'Connection string is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      const url = new URL(connectionString)
      if (!url.protocol.startsWith('postgresql:') && !url.protocol.startsWith('postgres:')) {
        return NextResponse.json(
          { success: false, message: 'Invalid PostgreSQL connection string' },
          { status: 400 }
        )
      }
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid connection string format' },
        { status: 400 }
      )
    }

    // Actually test the connection
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 5000 // 5 second timeout
    })

    console.log('🔌 Testing database connection...')

    await client.connect()
    console.log('✅ Database connected successfully')

    // Run a simple query to verify
    const result = await client.query('SELECT NOW() as time, version() as version')
    await client.end()

    const dbVersion = result.rows[0]?.version
    const shortVersion = dbVersion?.split(' ').slice(0, 2).join(' ') || 'PostgreSQL'

    console.log(`✅ Database connection successful: ${shortVersion}`)

    return NextResponse.json({
      success: true,
      message: `Successfully connected to database`,
      version: shortVersion
    })
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)

    // Provide helpful error messages
    let message = 'Connection failed'

    if (error.code === 'ENOTFOUND') {
      message = `Cannot resolve hostname`
    } else if (error.code === 'ECONNREFUSED') {
      message = 'Connection refused. Check if database is running.'
    } else if (error.code === '28P01') {
      message = 'Authentication failed. Check username/password.'
    } else if (error.code === '3D000') {
      message = 'Database does not exist.'
    } else if (error.message?.includes('timeout')) {
      message = 'Connection timeout. Check firewall settings.'
    } else if (error.message) {
      message = error.message
    }

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
