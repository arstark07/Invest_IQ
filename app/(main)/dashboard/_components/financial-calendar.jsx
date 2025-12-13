"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Bell
} from "lucide-react";
import { getFinancialCalendar } from "@/actions/dashboard-widgets";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function FinancialCalendar({ defaultAccountId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getFinancialCalendar(year, month, defaultAccountId);
      if (result.success) {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchData();
  }, [year, month, defaultAccountId]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDay(null);
  };

  const getDayData = (day) => {
    return data?.calendarData?.[day] || null;
  };

  const days = [];
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-10" />);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = getDayData(day);
    const hasActivity = dayData && (dayData.income > 0 || dayData.expenses > 0);
    const hasUpcoming = dayData?.upcoming?.length > 0;
    const isToday = new Date().getDate() === day && 
                   new Date().getMonth() + 1 === month && 
                   new Date().getFullYear() === year;
    const isSelected = selectedDay === day;

    days.push(
      <button
        key={day}
        onClick={() => setSelectedDay(day)}
        className={`
          h-10 rounded-lg text-sm font-medium relative transition-colors
          ${isToday ? "bg-primary text-primary-foreground" : ""}
          ${isSelected && !isToday ? "bg-primary/20 border-2 border-primary" : ""}
          ${hasActivity && !isToday && !isSelected ? "bg-muted" : ""}
          hover:bg-muted/80
        `}
      >
        {day}
        {(hasActivity || hasUpcoming) && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {dayData?.income > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            )}
            {dayData?.expenses > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
            {hasUpcoming && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </div>
        )}
      </button>
    );
  }

  const selectedDayData = selectedDay ? getDayData(selectedDay) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Financial Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-32 text-center">{monthName}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {data?.summary && (
          <CardDescription>
            {data.summary.transactionCount} transactions • {formatCurrency(data.summary.totalIncome)} income • {formatCurrency(data.summary.totalExpenses)} expenses
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Calendar Grid */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="h-8 flex items-center justify-center text-xs text-muted-foreground font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Income</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Expense</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Upcoming</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Day Details */}
          <div className="border-l pl-4">
            {selectedDay && selectedDayData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {new Date(year, month - 1, selectedDay).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h4>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedDayData.income > 0 && (
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="text-xs">Income</span>
                      </div>
                      <p className="font-bold text-green-600">{formatCurrency(selectedDayData.income)}</p>
                    </div>
                  )}
                  {selectedDayData.expenses > 0 && (
                    <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="flex items-center gap-1 text-red-600">
                        <ArrowDownRight className="h-4 w-4" />
                        <span className="text-xs">Expenses</span>
                      </div>
                      <p className="font-bold text-red-600">{formatCurrency(selectedDayData.expenses)}</p>
                    </div>
                  )}
                </div>

                {/* Transactions */}
                {selectedDayData.transactions?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Transactions</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedDayData.transactions.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span className="truncate">{t.description || t.category}</span>
                          <span className={t.type === "INCOME" ? "text-green-600" : "text-red-600"}>
                            {t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Bills */}
                {selectedDayData.upcoming?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Bell className="h-4 w-4" />
                      Upcoming Bills
                    </p>
                    <div className="space-y-1">
                      {selectedDayData.upcoming.map((bill, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-blue-50 dark:bg-blue-950 rounded">
                          <span>{bill.description}</span>
                          <Badge variant="outline">{formatCurrency(bill.amount)}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {selectedDay ? "No activity on this day" : "Select a day to view details"}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
