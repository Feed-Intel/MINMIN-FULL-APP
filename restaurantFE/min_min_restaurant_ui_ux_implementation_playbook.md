# MinMin Restaurant UI/UX Implementation Playbook

This playbook translates the provided UI mockups into a production‑ready implementation plan. It covers information architecture, page‑by‑page behavior, component inventory, state models, routing, accessibility, and step‑by‑step build scripts for both **Web (Next.js + Tailwind + shadcn/ui)** and **Mobile (React Native + Expo + NativeWind + React Navigation)**.

> Pages detected from your assets: **Dashboard**, **Menu**, **Create Order**, **Place Order**, **View Orders**, **Available Times**, **Add Related Item**, **Notifications**, **Filters**, **New Order Received**.

---

## 1) Information Architecture (IA) & Navigation

**Primary Nav (Admin/Dashboard app):**
- Dashboard
- Orders
  - New Order Received (modal/toast)
  - View Orders (list + filters)
  - Create Order / Place Order (flow)
- Menu
  - Menu List (browse/search)
  - Add Related Item (inline modal)
- Scheduling
  - Available Times (config)
- Notifications
- Settings (brand, taxes, printers, roles)

**Secondary (in‑page) Nav Patterns:**
- Tabs: *All / In‑Progress / Ready / Completed / Cancelled*
- Filters Drawer/Popover: *Date range, Branch, Channel, Category, Status*
- Search: *Debounced input, keyboard shortcuts (Web: ⌘K)*

**Navigation rules:**
- New order alerts are non‑blocking toasts that also add a badge to **Orders**.
- Creating an order is a wizard: *Select Items → Customize → Review → Place Order*.

---

## 2) Visual System & Layout

**Spacing & Grid**
- Base unit: 4px. Spacing scale: 4/8/12/16/20/24/32/40.
- Containers: max‑width 1200px (Web). Mobile uses 16px side paddings.

**Typography**
- Headings: H1/H2/H3, weight‑600.
- Body: 14–16px, 1.5 line height.
- Numbers (prices, counts) use tabular numerals where possible.

**Color/State**
- Primary: brand color.
- Success: green; Warning: amber; Danger: red; Info: blue.
- States: hover, focus-visible, active, disabled. Provide high‑contrast focus rings.

**Components**
- Cards for key metrics.
- Data tables with sticky header, column sort, and pagination.
- Drawers/Sheets for create/edit flows on desktop; full‑screen modals on mobile.
- Toasts/snackbars for ephemeral events (e.g., new order).

---

## 3) Data Models (shared between Web & Mobile)

```ts
// core/entities.ts
export type Money = { currency: string; amount: number }; // cents/minor units

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: Money;
  photoUrl?: string;
  categoryId: string;
  relatedItemIds?: string[];
  isAvailable: boolean;
};

export type Category = { id: string; name: string; parentId?: string };

export type OrderLine = {
  itemId: string;
  qty: number;
  unitPrice: Money;
  options?: Record<string, string | number | boolean>; // e.g., size, cheese
};

export type Order = {
  id: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  channel: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  createdAt: string; // ISO
  lines: OrderLine[];
  subtotal: Money;
  discount?: Money;
  tax?: Money;
  total: Money;
  notes?: string;
};

export type AvailabilitySlot = {
  id: string;
  dayOfWeek: number; // 0-6
  start: string; // '09:00'
  end: string;   // '18:00'
};

export type Notification = {
  id: string;
  type: 'ORDER' | 'SYSTEM' | 'INVENTORY';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};
```

---

## 4) API Contract (example)

```http
GET    /api/dashboard/metrics?from&to
GET    /api/orders?status&from&to&branch&page&pageSize
POST   /api/orders                 // create order
GET    /api/orders/:id
PATCH  /api/orders/:id             // update status/notes
GET    /api/menu/items?search&cat
POST   /api/menu/items/related     // set related items
GET    /api/schedule/slots
POST   /api/schedule/slots
GET    /api/notifications?unread=true
PATCH  /api/notifications/:id/read
```

- Use **RTK Query** (Web) and **TanStack Query** (Mobile) for caching/invalidations.
- WebSockets (or SSE) for **New Order Received** events: `ws://.../orders/stream`.

---

## 5) Page‑by‑Page Behavior & Acceptance Criteria

### A) Dashboard
- **What it shows:** Revenue today, Orders in each status, Average prep time, Top items.
- **Interactions:** Time range picker; clicking a KPI drills down to filtered Orders.
- **Empty states:** Show setup checklist if no data.
- **A11y:** Landmarks (main, nav), aria‑live for KPI updates when streaming.

### B) Orders → View Orders
- **Layout:** Table with columns: ID, Time, Channel, Items (count), Total, Status, Actions.
- **Filters:** Status, Channel, Date range, Branch. Persist last filters per user.
- **Row action:** View details (side panel). Keyboard: ↑/↓ navigate, Enter opens.
- **Real‑time:** New orders appear at top with highlight for 5s.

### C) Orders → New Order Received (toast & panel)
- **Trigger:** Push from WebSocket.
- **Behavior:** Toast with "View" action opens order details panel; adds badge to Orders.

### D) Orders → Create Order / Place Order (wizard)
- **Steps:** 1) Browse menu (search, categories) → 2) Customize & add lines → 3) Review → 4) Confirm (Place Order).
- **Validation:** Must have ≥1 line; stock/availability check; totals auto‑calc.
- **Success:** Route to Order Details; trigger print if kitchen printer configured.

### E) Menu
- **Grid/List** of items with photo, price, availability toggle.
- **Row actions:** Edit, Duplicate, Delete (guard with confirm dialog).
- **Add Related Item:** Inline modal with searchable multi‑select; chips show selected.

### F) Scheduling → Available Times
- **UI:** Weekly matrix of slots; add/edit slot modal; copy to days.
- **Rules:** No overlapping slots; timezone awareness.

### G) Notifications
- **List:** Grouped by day; unread badge in topbar.
- **Actions:** Mark as read; bulk mark all as read; link to source (order/menu).

### H) Filters Component (shared)
- **Pattern:** Button → Sheet/Drawer on desktop; full‑screen on mobile.
- **Contents:** Status, Channel, Category, Date range; Reset; Apply.

---

## 6) Web Implementation (Next.js + Tailwind + shadcn/ui)

**Stack**
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui (Button, Card, Drawer, Dialog, Table, Toast)
- Redux Toolkit + RTK Query (store/api)
- Socket.IO client for real‑time

**Folder Structure**
```
apps/web/
  app/
    (dashboard)/dashboard/page.tsx
    (orders)/orders/page.tsx
    (orders)/orders/[id]/page.tsx
    (menu)/menu/page.tsx
    (schedule)/schedule/page.tsx
    (notifications)/notifications/page.tsx
    layout.tsx
  components/
    charts/ KpiCard.tsx, TrendChart.tsx
    orders/ OrderTable.tsx, OrderPanel.tsx, OrderWizard.tsx
    menu/   MenuGrid.tsx, RelatedItemModal.tsx
    shared/ FiltersSheet.tsx, DateRangePicker.tsx
  lib/
    store.ts, api.ts, socket.ts
  styles/globals.css
```

**Store boilerplate**
```ts
// lib/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer },
  middleware: (gDM) => gDM().concat(api.middleware),
});
```

**RTK Query**
```ts
// lib/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (b) => ({
    getMetrics: b.query<any, { from?: string; to?: string }>({ query: (q) => ({ url: 'dashboard/metrics', params: q }) }),
    getOrders:  b.query<any, { status?: string; page?: number; pageSize?: number }>({ query: (q) => ({ url: 'orders', params: q }) }),
    getMenu:    b.query<any, { search?: string; cat?: string }>({ query: (q) => ({ url: 'menu/items', params: q }) }),
  }),
});
export const { useGetMetricsQuery, useGetOrdersQuery, useGetMenuQuery } = api;
```

**Socket hook**
```ts
// lib/socket.ts
import { io } from 'socket.io-client';
export const socket = io('/', { path: '/ws' });
```

**Order toast**
```tsx
// components/orders/NewOrderToast.tsx
'use client';
import { useEffect } from 'react';
import { socket } from '@/lib/socket';
import { useToast } from '@/components/ui/use-toast';

export default function NewOrderToast() {
  const { toast } = useToast();
  useEffect(() => {
    socket.on('order:new', (order) => {
      toast({ title: 'New Order Received', description: `#${order.id} — ${order.lines.length} items`, action: { label: 'View', onClick: () => window.location.assign(`/orders/${order.id}`) } });
    });
    return () => { socket.off('order:new'); };
  }, [toast]);
  return null;
}
```

**Filters Sheet**
```tsx
// components/shared/FiltersSheet.tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
export function FiltersSheet({ trigger, children }: { trigger: React.ReactNode, children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[380px]">
        <div className="space-y-4 p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
```

---

## 7) Mobile Implementation (React Native + Expo)

**Stack**
- Expo Router (file‑based routing)
- NativeWind (Tailwind for RN)
- TanStack Query + Axios
- React Navigation (if not using Expo Router’s stack)
- Expo Notifications for push; expo‑websocket for real‑time (or Socket.IO client)

**Folder Structure**
```
apps/mobile/
  app/
    dashboard.tsx
    orders/index.tsx
    orders/[id].tsx
    orders/create.tsx
    menu/index.tsx
    schedule/index.tsx
    notifications.tsx
  components/
    OrderCard.tsx
    MenuCard.tsx
    FiltersDrawer.tsx
  lib/
    client.ts, query.ts
```

**Create Order flow (mobile)**
```tsx
// app/orders/create.tsx
import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
export default function CreateOrder() {
  const [step, setStep] = useState(1);
  return (
    <View className="flex-1 bg-white">
      {step === 1 && <ScrollView>{/* Menu browse grid */}</ScrollView>}
      {step === 2 && <ScrollView>{/* Customize */}</ScrollView>}
      {step === 3 && <ScrollView>{/* Review */}</ScrollView>}
      <View className="p-4 flex-row gap-2">
        {step > 1 && <Pressable onPress={() => setStep(step - 1)} className="px-4 py-3 rounded-xl bg-gray-100"><Text>Back</Text></Pressable>}
        <Pressable onPress={() => setStep(step + 1)} className="px-4 py-3 rounded-xl bg-black"><Text className="text-white">Next</Text></Pressable>
      </View>
    </View>
  );
}
```

---

## 8) Reusable Components Inventory

- **KpiCard** (icon, label, value, delta)
- **OrderTable / OrderCard** (list & card views)
- **OrderPanel** (details side panel)
- **OrderWizard** (4 steps)
- **MenuGrid / MenuCard** (image, title, price, toggle availability)
- **RelatedItemModal** (searchable multi‑select)
- **FiltersSheet / FiltersDrawer** (status, channel, date, category)
- **DateRangePicker**
- **Toast/NotificationBell** (unread badge)
- **Pagination** (table footer)

Each component should ship with:
- Props interface + Storybook stories
- Unit tests (Vitest/RTL for Web; Jest/RTL for RN)
- A11y review (roles, labels, focus management)

---

## 9) State & Side‑Effects

**Cache strategy**
- List endpoints cached by query params; order details normalized by ID.
- Invalidate orders list on status changes.

**Real‑time**
- Merge `order:new` events into cache optimistically; show toast.

**Optimistic UI**
- Toggle availability for MenuItem instantly; rollback on failure.

**Error handling**
- Toast + inline field errors; retry buttons for network failures.

---

## 10) Accessibility, i18n, and Performance

- **A11y:** keyboard traps avoided; focus visible; aria‑live for dynamic updates.
- **i18n:** date/time/number formatting; text externalized; RTL readiness.
- **Performance:** virtualized lists for orders & menu; image lazy‑loading; code‑splitting routes.

---

## 11) Build Scripts (from zero to working UI)

### Web (Next.js)
1. `pnpm create next-app -e with-shadcn`
2. `pnpm add @reduxjs/toolkit react-redux @tanstack/react-table @tanstack/react-virtual socket.io-client`
3. Initialize **Tailwind** and **shadcn/ui**; generate Button, Card, Dialog, Sheet, Table, Toast.
4. Create `lib/store.ts`, `lib/api.ts`, wrap `app/layout.tsx` with `<Provider>`.
5. Implement **Dashboard** with `useGetMetricsQuery` and **KpiCard**.
6. Implement **Orders** table + **FiltersSheet** + **OrderPanel**.
7. Wire **NewOrderToast** using `socket.on('order:new')`.
8. Implement **Menu** grid + **RelatedItemModal**.
9. Implement **Available Times** weekly matrix.
10. Add **Notifications** page and topbar bell.

### Mobile (Expo)
1. `npx create-expo-app@latest`
2. `npx expo install nativewind react-native-svg expo-notifications @tanstack/react-query`
3. Configure NativeWind; set up QueryClientProvider.
4. Build **dashboard.tsx** with KPIs and **OrderCard** list.
5. Build **orders/index.tsx** and **orders/[id].tsx** with details.
6. Implement **orders/create.tsx** (wizard) and **menu/index.tsx** (grid).
7. Add push notifications + WebSocket listener for new orders.

---

## 12) QA Checklist per Page

- Loading/empty/error states covered
- Keyboard navigation and focus order
- Responsive (≤360px mobile → ≥1280px desktop)
- Dark mode contrast (if supported)
- Analytics events (page view, filter apply, order created)

---

## 13) Open Questions to Validate with Stakeholders (fill in)

- Payment flows (split bill, tips, service charge)?
- Kitchen display integration & printing rules?
- Multi‑branch permissions & roles?
- Tax/VAT rules and rounding?
- Inventory sync & out‑of‑stock behavior?

---

## 14) Deliverables

- Working Web dashboard with real‑time orders
- Mobile operator app with create/order flow
- Component library with Storybook docs
- API collection (REST) + WebSocket event catalog
- Test coverage & accessibility report

---

**Next step:** Start with the Web **Dashboard → Orders** slice, since it unblocks the alerting and operational flow. Then parallelize **Menu** and **Create/Place Order** wizard. 

