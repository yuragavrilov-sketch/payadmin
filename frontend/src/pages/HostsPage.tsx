import { useState } from 'react'
import { cn } from '@/lib/utils'
import HostsServersTab from '@/components/HostsServersTab'
import HostsCredentialsTab from '@/components/HostsCredentialsTab'
import HostsServiceGroupsTab from '@/components/HostsServiceGroupsTab'

const tabs = ['Servers', 'Credentials', 'Service Groups'] as const
type Tab = typeof tabs[number]

export default function HostsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Servers')

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-800">Hosts</h1>
        <p className="text-sm text-slate-400">Manage servers and credentials</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-slate-200 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm transition-colors -mb-[2px]',
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Servers' && <HostsServersTab />}
      {activeTab === 'Credentials' && <HostsCredentialsTab />}
      {activeTab === 'Service Groups' && <HostsServiceGroupsTab />}
    </div>
  )
}
