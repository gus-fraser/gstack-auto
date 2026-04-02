'use client'

import { useState } from 'react'
import { AdminUploadTab } from '@/components/admin/upload-tab'
import { AdminLpsTab } from '@/components/admin/lps-tab'
import { AdminQuestionsTab } from '@/components/admin/questions-tab'

type Tab = 'upload' | 'lps' | 'questions'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'upload', label: 'Upload' },
  { key: 'lps', label: 'LPs' },
  { key: 'questions', label: 'Questions' },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('upload')

  return (
    <div>
      <h1 className="text-[24px] font-semibold text-text-primary">Admin Dashboard</h1>
      <p className="mt-1 text-[15px] text-text-secondary">
        Manage fund data, LP access, and view question logs
      </p>

      {/* Tab bar */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-[15px] font-medium transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'upload' && <AdminUploadTab />}
        {activeTab === 'lps' && <AdminLpsTab />}
        {activeTab === 'questions' && <AdminQuestionsTab />}
      </div>
    </div>
  )
}
