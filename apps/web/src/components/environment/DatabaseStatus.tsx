'use client'

import { Badge, Tooltip } from '@mantine/core'
import { IconCircleCheckFilled, IconAlertCircleFilled, IconCircleDotted } from '@tabler/icons-react'

interface DatabaseStatusProps {
  status: 'connected' | 'disconnected' | 'unknown' | 'testing'
  message?: string
}

export function DatabaseStatus({ status, message }: DatabaseStatusProps) {
  if (status === 'unknown') {
    return (
      <Badge
        color="gray"
        variant="light"
        leftSection={<IconCircleDotted size={14} />}
        size="lg"
      >
        Not configured
      </Badge>
    )
  }

  if (status === 'testing') {
    return (
      <Badge
        color="blue"
        variant="light"
        leftSection={
          <div className="animate-pulse">
            <IconCircleDotted size={14} />
          </div>
        }
        size="lg"
      >
        Testing connection...
      </Badge>
    )
  }

  if (status === 'connected') {
    return (
      <Tooltip label={message || 'Database connected successfully'}>
        <Badge
          color="green"
          variant="light"
          leftSection={<IconCircleCheckFilled size={14} />}
          size="lg"
        >
          Connected
        </Badge>
      </Tooltip>
    )
  }

  return (
    <Tooltip label={message || 'Database connection failed'}>
      <Badge
        color="red"
        variant="light"
        leftSection={<IconAlertCircleFilled size={14} />}
        size="lg"
      >
        Disconnected
      </Badge>
    </Tooltip>
  )
}
