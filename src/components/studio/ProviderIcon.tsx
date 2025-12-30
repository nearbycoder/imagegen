interface ProviderIconProps {
  provider: string
  className?: string
}

export function ProviderIcon({ provider, className = '' }: ProviderIconProps) {
  const baseClasses = 'h-5 w-5 flex-shrink-0 flex items-center justify-center'

  // OpenAI logo - simple representation
  if (provider === 'OpenAI') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
        >
          <path
            d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.4397-1.7848 6.0462 6.0462 0 0 0-1.51-1.9693 6.1431 6.1431 0 0 0-8.1037-.1244l-.1169.1018a5.9656 5.9656 0 0 0-1.471 2.5268c-.0388.1758-.0599.3548-.0737.5335a5.802 5.802 0 0 0-.0025.3779 5.936 5.936 0 0 0 .5815 2.4489 5.8497 5.8497 0 0 0 1.5407 1.8667 6.1113 6.1113 0 0 0 2.2494 1.2905 5.933 5.933 0 0 0 2.5159.142 5.839 5.839 0 0 0 1.8676-.5822 5.9722 5.9722 0 0 0 2.0522-1.6176 5.9882 5.9882 0 0 0 .8805-2.5733c.027-.2118.0388-.425.0334-.6383a5.8947 5.8947 0 0 0-.1616-1.3018z"
            fill="currentColor"
          />
          <path
            d="M11.8139 20.9318c.3148 0 .6295-.0237.9414-.0711a5.9377 5.9377 0 0 0 2.4489-.5815 5.8544 5.8544 0 0 0 1.8667-1.5407 6.1113 6.1113 0 0 0 1.2905-2.2494 5.933 5.933 0 0 0 .142-2.5159 5.839 5.839 0 0 0-.5822-1.8676 5.9722 5.9722 0 0 0-1.6176-2.0522 5.9882 5.9882 0 0 0-2.5733-.8805 5.8947 5.8947 0 0 0-1.3018-.1616 5.802 5.802 0 0 0-.3779-.0025 5.936 5.936 0 0 0-2.5268 1.471c-.1758.0388-.3548.0599-.5335.0737a5.9847 5.9847 0 0 0-1.7848.4397 6.0462 6.0462 0 0 0-1.9693 1.51 6.1431 6.1431 0 0 0-.1244 8.1037l.1018.1169a5.9656 5.9656 0 0 0 2.5268 1.471c.1758.0388.3548.0599.5335.0737a5.802 5.802 0 0 0 .3779.0025 5.936 5.936 0 0 0 2.4489-.5815 5.8497 5.8497 0 0 0 1.8667-1.5407 6.1113 6.1113 0 0 0 1.2905-2.2494 5.933 5.933 0 0 0 .142-2.5159 5.839 5.839 0 0 0-.5822-1.8676 5.9722 5.9722 0 0 0-1.6176-2.0522 5.9882 5.9882 0 0 0-2.5733-.8805 5.8947 5.8947 0 0 0-1.3018-.1616z"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      </div>
    )
  }

  // Google logo
  if (provider === 'Google') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      </div>
    )
  }

  // ByteDance/Seed logo - using a simple representation
  if (provider === 'ByteDance Seed' || provider.includes('ByteDance')) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
          <path
            d="M12 2L15 8L21 9L16 13L17 19L12 16L7 19L8 13L3 9L9 8Z"
            fill="currentColor"
          />
        </svg>
      </div>
    )
  }

  // Black Forest Labs/FLUX logo - using a simple representation
  if (provider === 'Black Forest Labs' || provider.includes('Black Forest')) {
    return (
      <div className={`${baseClasses} ${className}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill="currentColor"
            opacity="0.8"
          />
          <path
            d="M2 17L12 22L22 17L12 12L2 17Z"
            fill="currentColor"
            opacity="0.8"
          />
          <path d="M2 12L12 17L22 12L12 7L2 12Z" fill="currentColor" />
        </svg>
      </div>
    )
  }

  // Default fallback icon
  return (
    <div className={`${baseClasses} rounded bg-muted ${className}`}>
      <div className="h-3 w-3 rounded bg-muted-foreground/30" />
    </div>
  )
}
