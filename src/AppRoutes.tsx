import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import WidgetPage from '@/pages/WidgetPage/WidgetPage'

const ConfigPage = lazy(() => import('@/pages/ConfigPage/ConfigPage'))
const NotFound = lazy(() => import('@/pages/NotFound/NotFound'))

const AppRoutes = () => (
  <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={<ConfigPage />} />
      <Route path="/widget" element={<WidgetPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
)

export default AppRoutes
