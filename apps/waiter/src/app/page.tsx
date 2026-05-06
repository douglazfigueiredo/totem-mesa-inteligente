'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, isPaired, isLoggedIn } from '@/lib/auth-store';
import { useWaiterStore } from '@/lib/waiter-store';
import { TopBar } from '@/components/TopBar';
import { TabBar, type Tab } from '@/components/TabBar';
import { CallsList } from '@/components/CallsList';
import { DeliveryList } from '@/components/DeliveryList';

export default function HomePage() {
  const router = useRouter();
  const paired = useAuthStore(isPaired);
  const logged = useAuthStore(isLoggedIn);

  const calls = useWaiterStore((s) => s.calls);
  const orders = useWaiterStore((s) => s.orders);
  const deliveredIds = useWaiterStore((s) => s.deliveredIds);

  const [tab, setTab] = useState<Tab>('calls');

  useEffect(() => {
    if (!paired) router.replace('/pair');
    else if (!logged) router.replace('/login');
  }, [paired, logged, router]);

  const callsBadge = useMemo(() => {
    let n = 0;
    for (const c of calls.values()) if (c.status === 'pending') n++;
    return n;
  }, [calls]);

  const deliveryBadge = useMemo(() => {
    let n = 0;
    for (const o of orders.values()) {
      if (deliveredIds.has(o.id)) continue;
      if (o.status === 'pronto') n++;
    }
    return n;
  }, [orders, deliveredIds]);

  if (!paired || !logged) return null;

  return (
    <>
      <TopBar />
      <main className="scroll">{tab === 'calls' ? <CallsList /> : <DeliveryList />}</main>
      <TabBar
        active={tab}
        callsBadge={callsBadge}
        deliveryBadge={deliveryBadge}
        onChange={setTab}
      />
    </>
  );
}
