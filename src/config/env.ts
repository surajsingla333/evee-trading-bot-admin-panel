export type AppEnv = 'test' | 'development' | 'production'

const rawEnv = (import.meta.env.VITE_APP_ENV || 'development').toLowerCase()

export const appEnv: AppEnv =
  rawEnv === 'test' || rawEnv === 'production' || rawEnv === 'development'
    ? rawEnv
    : 'development'

/** `test` uses local mock datasets; `development` and `production` hit the Admin API. */
export const useMockData = appEnv === 'test'

export const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const apiToken = import.meta.env.VITE_API_TOKEN || ''
