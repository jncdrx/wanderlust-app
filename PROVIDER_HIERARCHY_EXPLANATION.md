# React Context Provider Hierarchy - Complete Guide

## Current Structure (Corrected)

```
<ErrorBoundary>                    ← Catches all React errors
  <SessionProvider>                ← Provides: useSession()
    <QueryClientProvider>           ← Provides: useQuery(), useMutation()
      <DataProvider>                ← Provides: useTravelData()
        <AppContent>                ← Manages intro flow
          <BrowserRouter>            ← Provides: useLocation(), useNavigate()
            <ErrorBoundary>          ← Catches route-level errors
              <AppRouter />          ← Uses: useSession(), useTravelData(), useLocation()
            </ErrorBoundary>
          </BrowserRouter>
        </AppContent>
      </DataProvider>
    </QueryClientProvider>
  </SessionProvider>
</ErrorBoundary>
```

## Required Provider Order

The exact nesting order you specified is:

1. **SessionProvider** (outermost)
2. **QueryClientProvider**
3. **DataProvider**
4. **AppRouter** (innermost)

## Why This Order is Critical

### React Context Principle

React Context works through a **descendant tree**:
- A Provider makes its value available to **all components below it** in the component tree
- A hook can only access context from providers that are **ancestors** (above) in the tree
- If a hook is called outside its required Provider, React throws: `"must be used within a Provider"`

### Dependency Chain

```
SessionProvider
  ↓ (provides useSession)
QueryClientProvider
  ↓ (provides useQuery)
DataProvider
  ↓ (uses useSession + useQuery, provides useTravelData)
AppRouter
  ↓ (uses useTravelData)
```

### What Each Provider Does

1. **SessionProvider**
   - Provides: `currentUser`, `login()`, `logout()`, `darkMode`, etc.
   - Used by: `DataProvider` (via `useSession()`), `AppRouter` (via `useSession()`)

2. **QueryClientProvider**
   - Provides: React Query client for data fetching
   - Used by: `DataProvider` (via `useQuery()`, `useMutation()`)

3. **DataProvider**
   - **Depends on**: SessionProvider and QueryClientProvider
   - **Provides**: `trips`, `destinations`, `photos`, `addTrip()`, etc.
   - **Used by**: `AppRouter` (via `useTravelData()`)

4. **AppRouter**
   - **Uses**: `useSession()`, `useTravelData()`, `useLocation()`, `useNavigate()`
   - **Must be inside**: All three providers above

## Common Mistakes

### ❌ Wrong Order #1: DataProvider before SessionProvider
```tsx
<DataProvider>        ← ERROR: DataProvider uses useSession()
  <SessionProvider>   ← But SessionProvider is below!
    <AppRouter />
  </SessionProvider>
</DataProvider>
```
**Result**: `useSession must be used within a SessionProvider`

### ❌ Wrong Order #2: AppRouter before DataProvider
```tsx
<SessionProvider>
  <QueryClientProvider>
    <AppRouter />        ← ERROR: AppRouter uses useTravelData()
    <DataProvider>       ← But DataProvider is below!
      ...
    </DataProvider>
  </QueryClientProvider>
</SessionProvider>
```
**Result**: `useTravelData must be used within a DataProvider`

### ❌ Wrong Order #3: QueryClientProvider after DataProvider
```tsx
<SessionProvider>
  <DataProvider>        ← ERROR: DataProvider uses useQuery()
    <QueryClientProvider>  ← But QueryClientProvider is below!
      <AppRouter />
    </QueryClientProvider>
  </DataProvider>
</SessionProvider>
```
**Result**: `useQuery must be used within a QueryClientProvider`

## Correct Implementation

The current `App.tsx` structure is correct:

```tsx
export default function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>              {/* 1. Outermost - provides useSession */}
        <QueryClientProvider>        {/* 2. Provides useQuery */}
          <DataProvider>             {/* 3. Provides useTravelData */}
            <AppContent />          {/* 4. Renders AppRouter inside */}
          </DataProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
```

Where `AppContent` renders:
```tsx
<BrowserRouter>
  <ErrorBoundary>
    <AppRouter />  {/* Uses useTravelData - works because DataProvider is above */}
  </ErrorBoundary>
</BrowserRouter>
```

## Verification Checklist

✅ **SessionProvider** wraps everything that needs authentication  
✅ **QueryClientProvider** is inside SessionProvider  
✅ **DataProvider** is inside both SessionProvider and QueryClientProvider  
✅ **AppRouter** is inside DataProvider  
✅ **BrowserRouter** wraps AppRouter (for routing hooks)  

## Testing the Hierarchy

To verify the hierarchy is correct, check:

1. **AppRouter can use `useSession()`** ✓
   - Because SessionProvider is an ancestor

2. **AppRouter can use `useTravelData()`** ✓
   - Because DataProvider is an ancestor

3. **DataProvider can use `useSession()`** ✓
   - Because SessionProvider is an ancestor

4. **DataProvider can use `useQuery()`** ✓
   - Because QueryClientProvider is an ancestor

## Debugging Tips

If you still get "must be used within a Provider" errors:

1. **Check React DevTools**: Inspect the component tree to see actual provider nesting
2. **Check for conditional rendering**: Make sure providers aren't conditionally rendered
3. **Check for multiple instances**: Ensure you're not rendering the app twice
4. **Check import paths**: Verify you're importing from the correct files
5. **Check for early returns**: Make sure providers aren't being skipped by early returns

## Best Practices

1. **Keep providers at the root**: Providers should be as high in the tree as possible
2. **One provider per concern**: Each provider handles one aspect (auth, data, routing)
3. **Document dependencies**: Comment which providers each component needs
4. **Use TypeScript**: TypeScript helps catch provider dependency issues
5. **Test in isolation**: Test components that use context hooks

