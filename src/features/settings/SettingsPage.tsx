import { Card, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useTheme } from '@/hooks/useTheme'
import { useState } from 'react'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [tradeAlerts, setTradeAlerts] = useState(true)

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Workspace preferences, notifications, and account controls."
      />

      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        <Card>
          <CardHeader title="Profile" description="Admin identity" />
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Display name</label>
              <Input defaultValue="Alex Rivera" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
              <Input defaultValue="alex@stack.admin" type="email" />
            </div>
            <Button>Save changes</Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Appearance" description="Theme & density" />
          <div className="space-y-4">
            <div className="flex gap-2">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`flex-1 rounded-[14px] border px-4 py-3 text-sm font-medium capitalize transition-all duration-200 ${
                    theme === t
                      ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300'
                      : 'border-border dark:border-border-dark text-muted hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Notifications" description="Alert preferences" />
          <div className="space-y-5">
            <Switch
              checked={emailAlerts}
              onChange={setEmailAlerts}
              label="Email digests"
              description="Daily summary of trades, risks, and payouts."
            />
            <Switch
              checked={tradeAlerts}
              onChange={setTradeAlerts}
              label="Live trade alerts"
              description="Push critical fills and failed executions instantly."
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
