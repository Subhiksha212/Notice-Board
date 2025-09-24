import React, { useState, useMemo } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getMonth, getYear } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, User, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  title: string;
  content: string;
  department: string;
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string; // Changed from 'date' to 'created_at'
  author: string;
  tags: string[];
}

const priorityColors = {
  low: "bg-success-light text-success border-success/20",
  medium: "bg-warning-light text-warning-foreground border-warning/20", 
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200"
};

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const navigate = useNavigate();

  // Fetch notices from Supabase
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const getNoticesForDate = (date: Date) => {
    return notices.filter(notice => 
      isSameDay(new Date(notice.created_at), date)
    );
  };

  const getDateWithNotices = () => {
    return notices.map(notice => new Date(notice.created_at));
  };

  const selectedDateNotices = selectedDate ? getNoticesForDate(selectedDate) : [];

  // Get notices for current month
  const monthNotices = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    return notices.filter(notice => {
      const noticeDate = new Date(notice.created_at);
      return noticeDate >= monthStart && noticeDate <= monthEnd;
    });
  }, [currentMonth, notices]);

  const modifiers = {
    hasNotices: getDateWithNotices(),
    selected: selectedDate ? [selectedDate] : []
  };

  const modifiersStyles = {
    hasNotices: {
      position: 'relative' as const,
    }
  };

  const handleMonthChange = (increment: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  // Custom Day component to handle date clicks properly
  const DayComponent = ({ date, ...props }: any) => {
    const hasNotices = getNoticesForDate(date).length > 0;
    const noticeCount = getNoticesForDate(date).length;
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    
    return (
      <div className="relative w-full h-full">
        <button
          type="button"
          {...props}
          className={cn(
            "w-full h-full flex items-center justify-center text-sm font-medium transition-all duration-200",
            hasNotices && "font-bold",
            isSelected && "bg-primary text-primary-foreground rounded-md"
          )}
          onClick={() => setSelectedDate(date)}
        >
          {format(date, "d")}
        </button>
        {hasNotices && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              noticeCount === 1 ? "bg-primary" : 
              noticeCount === 2 ? "bg-warning" : "bg-destructive"
            )} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Notice Calendar
        </h1>
        <p className="text-muted-foreground text-lg">
          View notices by date. Click on any date to see scheduled notices.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="xl:col-span-1">
          <Card className="shadow-card border-0 bg-card/70 backdrop-blur-sm">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  Calendar
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthChange(-1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthChange(1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {monthNotices.length} notice{monthNotices.length !== 1 ? 's' : ''} this month
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className={cn("w-full pointer-events-auto")}
                showOutsideDays={false}
                components={{
                  Day: DayComponent
                }}
              />
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Legend:</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-xs">1 notice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <span className="text-xs">2 notices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    <span className="text-xs">3+ notices</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Notices */}
        <div className="xl:col-span-2">
          <Card className="shadow-card border-0 bg-card/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedDate ? (
                  <>
                    Notices for{" "}
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      {format(selectedDate, "EEEE, MMMM do, yyyy")}
                    </span>
                  </>
                ) : (
                  "Select a date to view notices"
                )}
              </CardTitle>
              {selectedDateNotices.length > 0 && (
                <p className="text-muted-foreground">
                  {selectedDateNotices.length} notice{selectedDateNotices.length !== 1 ? 's' : ''} scheduled
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDateNotices.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateNotices.map((notice) => (
                    <Card 
                      key={notice.id} 
                      className="cursor-pointer hover:shadow-glow transition-all duration-300 border-0 bg-gradient-subtle backdrop-blur-sm hover:scale-[1.02]"
                      onClick={() => navigate(`/notice/${notice.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-semibold text-lg line-clamp-2 pr-4 hover:text-primary transition-colors">
                            {notice.title}
                          </h3>
                          <Badge className={cn(priorityColors[notice.priority], "flex-shrink-0")} variant="outline">
                            {notice.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                          {notice.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{notice.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span>{notice.department}</span>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/notice/${notice.id}`);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                        
                        {notice.tags && notice.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                            {notice.tags.map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-subtle flex items-center justify-center">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No notices scheduled</h3>
                  <p className="text-muted-foreground mb-4">
                    No notices are scheduled for this date.
                  </p>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {format(selectedDate, "EEEE, MMMM do, yyyy")}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/')}
                  >
                    View All Notices
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="mt-8">
        <Card className="shadow-card border-0 bg-card/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Month Overview - {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <p className="text-muted-foreground">
              All notices scheduled for this month
            </p>
          </CardHeader>
          <CardContent>
            {monthNotices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthNotices.map((notice) => (
                  <Card 
                    key={notice.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => navigate(`/notice/${notice.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm text-primary font-semibold">
                          {format(new Date(notice.created_at), "MMM d")}
                        </div>
                        <Badge className={cn(priorityColors[notice.priority], "text-xs")} variant="outline">
                          {notice.priority}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm line-clamp-2 mb-2">
                        {notice.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notice.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{notice.department}</span>
                        <span>•</span>
                        <span>{notice.author}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No notices scheduled for this month.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;