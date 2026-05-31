export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="rounded-card border border-hairline bg-card p-6">
      <div className="mb-5 text-sm font-semibold text-body">{label}</div>
      <div className="space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-elevated" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-elevated" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-elevated" />
      </div>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-hairline bg-card p-6">
      <div className="text-sm font-semibold text-down">Unable to load</div>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}

export function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-card border border-hairline bg-card p-8 text-center">
      <div className="text-sm font-semibold text-body">{title}</div>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}
