'use client';

import React, { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    {
      label: 'Últimos 7 dias',
      getValue: () => ({
        from: subDays(new Date(), 6),
        to: new Date()
      })
    },
    {
      label: 'Últimos 30 dias',
      getValue: () => ({
        from: subDays(new Date(), 29),
        to: new Date()
      })
    },
    {
      label: 'Mês atual',
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      label: 'Mês passado',
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        };
      }
    },
    {
      label: 'Últimos 3 meses',
      getValue: () => ({
        from: subMonths(new Date(), 2),
        to: new Date()
      })
    },
    {
      label: 'Últimos 6 meses',
      getValue: () => ({
        from: subMonths(new Date(), 5),
        to: new Date()
      })
    },
    {
      label: 'Este ano',
      getValue: () => ({
        from: startOfYear(new Date()),
        to: new Date()
      })
    }
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    onChange(preset.getValue());
    setIsOpen(false);
  };

  const formatDateRange = (range?: DateRange) => {
    if (!range?.from) {
      return 'Selecione um período';
    }

    if (!range.to) {
      return format(range.from, 'dd/MM/yyyy', { locale: ptBR });
    }

    return `${format(range.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(
      range.to,
      'dd/MM/yyyy',
      { locale: ptBR }
    )}`;
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Presets */}
            <div className="border-r border-border">
              <div className="p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Presets rápidos
                </p>
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={onChange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
