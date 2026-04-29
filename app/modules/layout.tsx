import ModuleLockGuard from '@/components/ModuleLockGuard'

export default function ModulesLayout({ children }: { children: React.ReactNode }) {
    return <ModuleLockGuard>{children}</ModuleLockGuard>
}
