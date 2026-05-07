import Header from '../components/Layout/Header'
import WeekCalendar from '../components/Calendar/WeekCalendar'
import { useApp } from '../context/AppContext'

export default function CalendarPage() {
  const { entries, createEntry, updateEntry, deleteEntry } = useApp()

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-hidden">
        <WeekCalendar
          entries={entries}
          onCreateEntry={createEntry}
          onUpdateEntry={updateEntry}
          onDeleteEntry={deleteEntry}
        />
      </div>
    </div>
  )
}
