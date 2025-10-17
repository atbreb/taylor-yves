'use client'

interface MobileMenuProps {
  isOpen: boolean
  onToggle: () => void
}

export function MobileMenu({ isOpen, onToggle }: MobileMenuProps) {
  return (
    <button
      type="button"
      className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      onClick={onToggle}
      aria-controls="mobile-menu"
      aria-expanded={isOpen}
    >
      <span className="sr-only">Open main menu</span>
      
      {/* Hamburger icon */}
      <svg
        className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
      
      {/* Close icon */}
      <svg
        className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}