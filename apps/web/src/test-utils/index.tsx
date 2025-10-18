import React, { ReactElement } from 'react'
import { render, RenderOptions, waitFor, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/theme/theme'

// Custom render function that includes Mantine provider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialColorScheme?: 'light' | 'dark'
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { initialColorScheme = 'light', ...renderOptions } = options || {}

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MantineProvider theme={theme} defaultColorScheme={initialColorScheme}>
        {children}
      </MantineProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Custom matchers and utilities
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  }, { timeout: 3000 })
