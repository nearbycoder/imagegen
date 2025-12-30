import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { Mountain } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    try {
      const result = await authClient.signUp.email({
        name: name || email.split('@')[0],
        email,
        password,
      })

      if (result.error) {
        toast.error(result.error.message || 'Failed to sign up')
        console.error(result.error)
      }

      if (result.data) {
        toast.success('Account created! Welcome!')
        router.navigate({ to: '/' })
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Background gradients matching app style */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-0 top-0 w-2/3 h-2/3 rounded-full bg-[oklch(0.15_0.05_277_/_0.3)] blur-2xl" />
        <div className="absolute right-0 bottom-0 w-2/3 h-2/3 rounded-full bg-[oklch(0.12_0.04_277_/_0.25)] blur-2xl" />
        <div className="absolute left-1/3 top-1/3 w-2/3 h-2/3 rounded-full bg-[oklch(0.10_0.03_277_/_0.15)] blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
        <Card className="w-full max-w-md border-border/50 bg-background/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, oklch(0.65 0.22 277 / 0.3) 0%, oklch(0.65 0.22 277 / 0.15) 100%)',
                }}
              >
                <Mountain className="h-5 w-5 text-primary relative z-10" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Create Account
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Start generating amazing AI images
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  name="name"
                  className="h-10"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  name="email"
                  required
                  className="h-10"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  required
                  className="h-10"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-base font-medium"
                disabled={isLoading}
                style={{
                  background:
                    'linear-gradient(135deg, oklch(0.14 0.02 277) 0%, oklch(0.12 0.015 277) 50%, oklch(0.13 0.018 277) 100%)',
                }}
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{' '}
              </span>
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
