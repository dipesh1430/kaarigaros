export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-primary">
            KaarigarOS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your garment unit
          </p>
        </div>
        <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
          Auth form — built in Phase 1
        </div>
      </div>
    </div>
  );
}
