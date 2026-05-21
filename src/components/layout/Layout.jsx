import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main id="main-scroll" className="flex-1 ml-[220px] min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
