'use client';

import { ActionIcon, useMantineColorScheme, useComputedColorScheme, Tooltip } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Tooltip label={computedColorScheme === 'dark' ? 'Light mode' : 'Dark mode'} position="bottom">
      <ActionIcon
        onClick={toggleColorScheme}
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
      >
        {computedColorScheme === 'dark' ? (
          <IconSun style={{ width: '1.2rem', height: '1.2rem' }} />
        ) : (
          <IconMoon style={{ width: '1.2rem', height: '1.2rem' }} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
