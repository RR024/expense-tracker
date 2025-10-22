import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

function Calendar({ events, setEvents }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: ''
  })

  // Get calendar data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Generate calendar days
  const generateCalendar = () => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1))
  }

  // Add event
  const handleAddEvent = (e) => {
    e.preventDefault()
    if (newEvent.title && newEvent.date) {
      setEvents([...events, { ...newEvent, id: Date.now() }])
      setNewEvent({ title: '', description: '', date: '' })
    }
  }

  // Delete event
  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id))
  }

  // Check if date has events
  const hasEventsOnDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.some(event => event.date === dateStr)
  }

  // Get events for a specific date
  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => event.date === dateStr)
  }

  // Handle date click
  const handleDateClick = (day) => {
    if (day) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      setSelectedDate(dateStr)
    }
  }

  // Get selected date events
  const selectedDateEvents = selectedDate ? events.filter(event => event.date === selectedDate) : []

  const days = generateCalendar()

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Event <span className="text-violet-400">Calendar</span>
        </h1>
        <p className="text-slate-400">Manage your financial events and reminders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-slate-900 rounded-lg p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{monthNames[month]} {year}</h2>
            <div className="flex gap-2">
              <button 
                onClick={previousMonth}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, index) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null
              const isSelected = dateStr === selectedDate
              
              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-[80px] p-2 rounded-lg border transition-all
                    ${day ? 'bg-slate-800 cursor-pointer' : 'bg-transparent border-transparent'}
                    ${isSelected ? 'border-violet-500 ring-2 ring-violet-500' : 'border-slate-700 hover:border-violet-500'}
                  `}
                >
                  {day && (
                    <div className="h-full flex flex-col">
                      <span className="text-sm font-semibold mb-1">{day}</span>
                      {hasEventsOnDate(day) && (
                        <div className="mt-auto flex justify-center">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        </div>
                      )}
                      {getEventsForDate(day).length > 0 && (
                        <div className="mt-1 space-y-1">
                          {getEventsForDate(day).slice(0, 2).map(event => (
                            <div key={event.id} className="text-[10px] bg-violet-600 rounded px-1 py-0.5 truncate">
                              {event.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Event Management Sidebar */}
        <div className="space-y-6">
          {/* Add Event Form */}
          <div className="bg-slate-900 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-400" />
              Add Event
            </h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Bill Payment"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event details..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </form>
          </div>

          {/* Events List */}
          <div className="bg-slate-900 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">
              {selectedDate ? (
                <>
                  Events on{' '}
                  <span className="text-violet-400">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </>
              ) : (
                'Upcoming Events'
              )}
            </h3>
            
            {selectedDate && selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-2">No events on this date</p>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  View all events
                </button>
              </div>
            ) : selectedDate && selectedDateEvents.length > 0 ? (
              <>
                <div className="space-y-3 mb-4">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="bg-slate-800 rounded-lg p-4 relative group border-l-4 border-violet-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-slate-400 mb-2">{event.description}</p>
                          )}
                          <p className="text-xs text-violet-400">
                            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-violet-400 hover:text-violet-300 w-full text-center"
                >
                  View all events
                </button>
              </>
            ) : events.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No events scheduled</p>
            ) : (
              <div className="space-y-3">
                {events
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(event => (
                    <div key={event.id} className="bg-slate-800 rounded-lg p-4 relative group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-slate-400 mb-2">{event.description}</p>
                          )}
                          <p className="text-xs text-violet-400">
                            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Calendar
