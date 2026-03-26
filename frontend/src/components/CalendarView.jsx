import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarView({ projects }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getProjectsForDay = (day) => {
    return projects.filter(p => p.deadline && isSameDay(new Date(p.deadline), day));
  };

  return (
    <div className="card overflow-hidden bg-white border-none shadow-sm">
      <div className="p-6 border-b border-surface-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
            <CalendarIcon size={20} />
          </div>
          <h2 className="text-xl font-display font-bold text-surface-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-surface-100 rounded-lg text-surface-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-surface-100 rounded-lg text-surface-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-surface-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-surface-400 uppercase tracking-widest bg-surface-50/50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const dayProjects = getProjectsForDay(day);
          return (
            <div 
              key={i} 
              className={`min-h-[120px] p-2 border-b border-r border-surface-50 flex flex-col transition-colors ${
                !isSameMonth(day, monthStart) ? 'bg-surface-50/30' : ''
              } ${isSameDay(day, new Date()) ? 'bg-brand-50/20' : ''}`}
            >
              <span className={`text-sm font-semibold mb-2 flex items-center justify-center w-7 h-7 rounded-full ${
                isSameDay(day, new Date()) ? 'bg-brand-600 text-white' : 'text-surface-600'
              }`}>
                {format(day, 'd')}
              </span>
              
              <div className="space-y-1">
                {dayProjects.map(proj => (
                  <div 
                    key={proj.pid}
                    className="text-[10px] px-1.5 py-1 rounded bg-brand-100 text-brand-700 font-bold truncate cursor-pointer hover:bg-brand-200"
                    title={proj.title}
                  >
                    {proj.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
